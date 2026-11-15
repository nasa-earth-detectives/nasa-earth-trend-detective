import { useEffect, useState } from 'react';
import { getHexDataset } from '../services/hexDataSource';
import type { HexDataset } from '../types/hex.types';
import type { TrendFilterParams } from '../types/trend.types';

interface HexDataState {
  key: string | null;
  data: HexDataset | null;
  loading: boolean;
  error: string | null;
}

/** Only queries upon activating the layer or changing the filter; never participates in the render loop. */
export function useHexData(filter: TrendFilterParams, enabled: boolean) {
  const { variable, startYear, endYear, minConfidence } = filter;
  const key = `${variable}:${startYear}:${endYear}:${minConfidence ?? ''}`;
  const [state, setState] = useState<HexDataState>({ key: null, data: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled) {
      setState({ key: null, data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setState({ key, data: null, loading: true, error: null });
    getHexDataset({ variable, startYear, endYear, minConfidence }, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, data, loading: false, error: null });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ key, data: null, loading: false,
          error: error instanceof Error ? error.message : 'Could not fetch trends.' });
      },
    );
    return () => controller.abort();
  }, [enabled, variable, startYear, endYear, minConfidence, key]);

  return {
    // Never display an outdated response under the name of the next variable or period.
    data: enabled && state.key === key ? state.data : null,
    loading: enabled && (state.key !== key || state.loading),
    error: enabled && state.key === key ? state.error : null,
  };
}
