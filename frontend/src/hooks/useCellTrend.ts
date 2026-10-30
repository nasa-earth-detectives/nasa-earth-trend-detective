import { useEffect, useState } from 'react';
import type { ClimateVariable } from '../types/climate.types';
import type { DatasetProvenance } from '../types/dataset.types';
import type { TimeSeriesDataPoint } from '../types/detective.types';
import { trendService } from '../services/trendService';

/** Veredicto Mann-Kendall / Sen calculado por el backend para una celda observada. */
export interface CellTrend {
  series: TimeSeriesDataPoint[];
  sensSlope: number;
  pValue: number;
  isSignificant: boolean;
  direction: string;
}

interface CellTrendState { key: string | null; data: CellTrend | null; loading: boolean; error: string | null }

function finite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`La API devolvió ${field} no válido.`);
  return value;
}

/** Frontera del TrendResultDto. Exige Source = "observed": una serie sintética no se pinta como real. */
export function adaptCellTrend(payload: unknown): CellTrend {
  if (!payload || typeof payload !== 'object') throw new Error('Respuesta de tendencia inválida.');
  const row = payload as Record<string, unknown>;
  if (row.source !== 'observed') throw new Error('La API no tiene observaciones reales para esta celda.');
  if (!Array.isArray(row.observations)) throw new Error('La tendencia no incluye la serie anual.');
  const series = row.observations.map((entry: unknown) => {
    const point = (entry ?? {}) as Record<string, unknown>;
    const value = point.anomaly ?? point.value;
    return { year: finite(point.year, 'year'), value: finite(value, 'value') };
  });
  return { series, sensSlope: finite(row.sensSlope, 'sensSlope'), pValue: finite(row.pValue, 'pValue'),
    isSignificant: row.isSignificant === true, direction: typeof row.direction === 'string' ? row.direction : 'Stable' };
}

/** Solo consulta con una celda de la API seleccionada; con la demo devuelve null sin pedir nada. */
export function useCellTrend(variable: ClimateVariable, provenance: DatasetProvenance | null,
  cell: { latitude: number; longitude: number } | null) {
  const latitude = cell?.latitude ?? null;
  const longitude = cell?.longitude ?? null;
  const key = provenance && latitude !== null && longitude !== null ? `${variable}:${latitude}:${longitude}` : null;
  const [state, setState] = useState<CellTrendState>({ key: null, data: null, loading: false, error: null });

  useEffect(() => {
    if (!key || !provenance || latitude === null || longitude === null) return;
    const controller = new AbortController();
    setState({ key, data: null, loading: true, error: null });
    trendService.getCellTrend({ variable, startYear: provenance.coverageStart, endYear: provenance.coverageEnd,
      latitude, longitude }, controller.signal)
      .then(payload => {
        if (!controller.signal.aborted) setState({ key, data: adaptCellTrend(payload), loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ key, data: null, loading: false,
          error: error instanceof Error ? error.message : 'No se pudo calcular la tendencia.' });
      });
    return () => controller.abort();
  }, [key, provenance, variable, latitude, longitude]);

  const current = key !== null && state.key === key;
  return { data: current ? state.data : null, loading: key !== null && (!current || state.loading),
    error: current ? state.error : null };
}
