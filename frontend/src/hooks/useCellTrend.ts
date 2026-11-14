import { useEffect, useState } from 'react';
import type { ClimateVariable } from '../types/climate.types';
import type { DatasetProvenance } from '../types/dataset.types';
import type { TimeSeriesDataPoint } from '../types/detective.types';
import { trendService } from '../services/trendService';

/** Mann-Kendall / Sen verdict computed by the backend for an observed cell. */
export interface CellTrend {
  series: TimeSeriesDataPoint[];
  sensSlope: number;
  pValue: number;
  isSignificant: boolean;
  zScore: number;
  direction: string;
  /** 95% confidence interval for Sen's slope; null if the API does not send it. */
  confidenceInterval95: [number, number] | null;
  /** Linear regression t-test on the same series; null if the API does not send it. */
  linear: LinearTrend | null;
}

export interface LinearTrend {
  slope: number;
  pValue: number;
  tStatistic: number;
  confidenceInterval95: [number, number];
  isSignificant: boolean;
}

interface CellTrendState { key: string | null; data: CellTrend | null; loading: boolean; error: string | null }

function finite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`API returned invalid ${field}.`);
  return value;
}

function interval(value: unknown): [number, number] | null {
  return Array.isArray(value) && value.length === 2
    && value.every((item: unknown) => typeof item === 'number' && Number.isFinite(item))
    ? [value[0] as number, value[1] as number] : null;
}

/** New DTO fields: if missing (legacy API) the card simply does not show them. */
function linearTrend(value: unknown): LinearTrend | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const confidenceInterval95 = interval(row.confidenceInterval95);
  if (typeof row.slope !== 'number' || typeof row.pValue !== 'number' || typeof row.tStatistic !== 'number'
    || !confidenceInterval95) return null;
  return { slope: row.slope, pValue: row.pValue, tStatistic: row.tStatistic, confidenceInterval95,
    isSignificant: row.isSignificant === true };
}

/** TrendResultDto boundary. Requires Source = "observed": a synthetic series is never shown as real. */
export function adaptCellTrend(payload: unknown): CellTrend {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid trend response.');
  const row = payload as Record<string, unknown>;
  if (row.source !== 'observed') throw new Error('The API has no real observations for this cell.');
  if (!Array.isArray(row.observations)) throw new Error('Trend response does not include the annual series.');
  const series = row.observations.map((entry: unknown) => {
    const point = (entry ?? {}) as Record<string, unknown>;
    const value = point.anomaly ?? point.value;
    return { year: finite(point.year, 'year'), value: finite(value, 'value') };
  });
  return { series, sensSlope: finite(row.sensSlope, 'sensSlope'), pValue: finite(row.pValue, 'pValue'),
    isSignificant: row.isSignificant === true, zScore: finite(row.mannKendallZ, 'mannKendallZ'),
    direction: typeof row.direction === 'string' ? row.direction : 'Stable',
    confidenceInterval95: interval(row.confidenceInterval95), linear: linearTrend(row.linear) };
}

/** Queries only when an API cell is selected; with demo it returns null without requesting anything. */
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
          error: error instanceof Error ? error.message : 'Could not compute trend.' });
      });
    return () => controller.abort();
  }, [key, provenance, variable, latitude, longitude]);

  const current = key !== null && state.key === key;
  return { data: current ? state.data : null, loading: key !== null && (!current || state.loading),
    error: current ? state.error : null };
}
