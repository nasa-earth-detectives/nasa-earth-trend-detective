import { useState, useEffect } from 'react';
import type { ClimateObservation } from '../types/climate.types';
import type { DatasetProvenance } from '../types/dataset.types';
import type { TrendFilterParams } from '../types/trend.types';
import { getObservationDataset, type ObservationSource } from '../services/observationDataSource';

interface ObservationState {
  key: string; data: ClimateObservation[]; loading: boolean; error: string | null;
  source: ObservationSource; provenance: DatasetProvenance | null;
}
const EMPTY_OBSERVATIONS: ClimateObservation[] = [];

export function useGlobeData(filter: TrendFilterParams) {
  const key = `${filter.variable}:${filter.endYear}`;
  const [state, setState] = useState<ObservationState>({ key, data: EMPTY_OBSERVATIONS, loading: true, error: null,
    source: 'demo', provenance: null });

  useEffect(() => {
    const controller = new AbortController();
    setState(previous => ({ ...previous, key, data: EMPTY_OBSERVATIONS, loading: true, error: null }));
    getObservationDataset(filter.variable, filter.endYear, controller.signal).then(dataset => {
      if (!controller.signal.aborted) setState({ key, data: dataset.observations, loading: false, error: null,
        source: dataset.source, provenance: dataset.provenance });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState(previous => ({ ...previous, key, data: EMPTY_OBSERVATIONS, loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener observaciones.' }));
    });
    return () => controller.abort();
  }, [filter.variable, filter.endYear, key]);

  // No mostrar un año anterior bajo la etiqueta del nuevo contexto, ni durante un solo render.
  return { data: state.key === key ? state.data : EMPTY_OBSERVATIONS,
    loading: state.key !== key || state.loading, error: state.key === key ? state.error : null,
    source: state.source, provenance: state.provenance };
}
