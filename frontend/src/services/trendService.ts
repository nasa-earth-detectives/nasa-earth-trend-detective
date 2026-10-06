import { getJson } from './apiClient';
import { ClimateObservation, ClimateVariable } from '../types/climate.types';
import { TrendFilterParams } from '../types/trend.types';

export interface CellTrendQuery {
  variable: ClimateVariable;
  startYear: number;
  endYear: number;
  latitude: number;
  longitude: number;
}

export const trendService = {
  async getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    return getJson<{ status: string; service: string; timestamp: string }>('/health');
  },

  /** Mann-Kendall / Sen por celda de toda la grilla observada (GET /api/trends/grid). */
  async getGridTrends(params: TrendFilterParams, signal?: AbortSignal): Promise<unknown> {
    return getJson<unknown>('/trends/grid', {
      variable: params.variable,
      startYear: params.startYear,
      endYear: params.endYear,
    }, { signal });
  },

  /** Serie anual y veredicto de una celda (GET /api/trends con latitud y longitud). */
  async getCellTrend(query: CellTrendQuery, signal?: AbortSignal): Promise<unknown> {
    return getJson<unknown>('/trends', { ...query }, { signal });
  },

  async getObservations(variable: ClimateVariable, year: number, signal?: AbortSignal): Promise<ClimateObservation[]> {
    return getJson<ClimateObservation[]>('/trends/observations', {
      variable,
      year,
    }, { signal });
  },
};
