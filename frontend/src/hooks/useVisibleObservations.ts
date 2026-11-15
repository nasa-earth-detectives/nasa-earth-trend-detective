import { useEffect, useMemo, useState } from 'react';
import type { ClimateObservation } from '../types/climate.types';
import type { DatasetProvenance } from '../types/dataset.types';
import type { ObservationCoverage, ObservationSource } from '../types/observationLayer.types';
import { filterObservationCoverage } from '../services/demo/observationDemoData';
import { thinRegularGrid } from '../utils/gridThinning';
import { filterLandCells, loadLandMask, type LandMask } from '../utils/landMask';

const EMPTY: ClimateObservation[] = [];

/**
 * What is actually rendered. The demo brings its own cartography; the API grid is thinned at
 * the poles and, with "land" coverage (initial view), is clipped using the globe mask:
 * covering the oceans as well covers the planet with columns and obscures the Earth.
 */
export function useVisibleObservations(observations: ClimateObservation[], source: ObservationSource,
  coverage: ObservationCoverage, provenance: DatasetProvenance | null) {
  const needsMask = source === 'api' && coverage === 'land';
  const [mask, setMask] = useState<LandMask | null>(null);
  const [maskFailed, setMaskFailed] = useState(false);

  useEffect(() => {
    if (!needsMask || mask) return;
    let active = true;
    loadLandMask().then(loaded => { if (active) setMask(loaded); }, (error: unknown) => {
      console.warn('Land mask not available; displaying full grid.', error);
      if (active) setMaskFailed(true);
    });
    return () => { active = false; };
  }, [needsMask, mask]);

  return useMemo(() => {
    if (source === 'demo') return filterObservationCoverage(observations, coverage);
    const thinned = thinRegularGrid(observations);
    if (coverage === 'global' || maskFailed) return thinned;
    return mask ? filterLandCells(thinned, mask, provenance?.resolutionDegrees ?? 2) : EMPTY;
  }, [observations, source, coverage, mask, maskFailed, provenance]);
}
