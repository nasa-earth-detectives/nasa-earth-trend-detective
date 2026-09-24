import { useState, useEffect } from 'react';
import type { ClimateObservation } from '../types/climate.types';
import type { TrendFilterParams } from '../types/trend.types';
import { getObservationDataset, OBSERVATION_DATA_SOURCE } from '../services/observationDataSource';

interface ObservationState { key: string; data: ClimateObservation[]; loading: boolean; error: string | null }
const EMPTY_OBSERVATIONS: ClimateObservation[] = [];

export function useGlobeData(filter: TrendFilterParams) {
  const key = `${filter.variable}:${filter.endYear}`;
  const [state, setState] = useState<ObservationState>({ key, data: EMPTY_OBSERVATIONS, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ key, data: EMPTY_OBSERVATIONS, loading: true, error: null });
    getObservationDataset(filter.variable, filter.endYear, controller.signal).then(dataset => {
      if (!controller.signal.aborted) setState({ key, data: dataset.observations, loading: false, error: null });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, data: EMPTY_OBSERVATIONS, loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener observaciones.' });
    });
    return () => controller.abort();
  }, [filter.variable, filter.endYear, key]);

  // No mostrar un año anterior bajo la etiqueta del nuevo contexto, ni durante un solo render.
  return { data: state.key === key ? state.data : EMPTY_OBSERVATIONS,
    loading: state.key !== key || state.loading, error: state.key === key ? state.error : null,
    source: OBSERVATION_DATA_SOURCE };
}
