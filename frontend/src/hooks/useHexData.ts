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

/** Solo consulta al activar la capa o cambiar el filtro; nunca participa del render loop. */
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
          error: error instanceof Error ? error.message : 'No se pudieron obtener las tendencias.' });
      },
    );
    return () => controller.abort();
  }, [enabled, variable, startYear, endYear, minConfidence, key]);

  return {
    // Nunca mostrar una respuesta vieja bajo el nombre de la siguiente variable o periodo.
    data: enabled && state.key === key ? state.data : null,
    loading: enabled && (state.key !== key || state.loading),
    error: enabled && state.key === key ? state.error : null,
  };
}
