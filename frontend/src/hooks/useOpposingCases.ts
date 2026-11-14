import { useEffect, useState } from 'react';
import { CASE_REGIONS, CASE_VARIABLES, caseKey } from '../config/opposingCases';
import { getDatasetCatalog } from '../services/datasetCatalog';
import { trendService } from '../services/trendService';
import { adaptCellTrend, type CellTrend } from './useCellTrend';

export type CaseVerdict =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; trend: CellTrend; startYear: number; endYear: number };

/**
 * Real verdict (Mann-Kendall / Sen) for each variable in each case-study region. Requested when
 * the panel opens, over the source's full coverage period; if the API fails or the variable has
 * no data, the cell says no data instead of showing a hardcoded figure.
 */
export function useOpposingCases(open: boolean): Record<string, CaseVerdict> {
  const [verdicts, setVerdicts] = useState<Record<string, CaseVerdict>>({});

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setVerdicts({});
    const put = (key: string, verdict: CaseVerdict) => {
      if (!controller.signal.aborted) setVerdicts(previous => ({ ...previous, [key]: verdict }));
    };

    void getDatasetCatalog().then(catalog => {
      for (const variable of CASE_VARIABLES) {
        const provenance = catalog.get(variable);
        for (const region of CASE_REGIONS) {
          const key = caseKey(variable, region.id);
          if (!provenance) { put(key, { status: 'error' }); continue; }
          const { coverageStart: startYear, coverageEnd: endYear } = provenance;
          trendService.getCellTrend({ variable, startYear, endYear, latitude: region.lat, longitude: region.lng },
            controller.signal)
            .then(payload => put(key, { status: 'ready', trend: adaptCellTrend(payload), startYear, endYear }))
            .catch(() => put(key, { status: 'error' }));
        }
      }
    });
    return () => controller.abort();
  }, [open]);

  return verdicts;
}
