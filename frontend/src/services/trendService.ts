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

  /** Mann-Kendall / Sen's slope per cell for the entire observed grid (GET /api/trends/grid). */
  async getGridTrends(params: TrendFilterParams, signal?: AbortSignal): Promise<unknown> {
    return getJson<unknown>('/trends/grid', {
      variable: params.variable,
      startYear: params.startYear,
      endYear: params.endYear,
    }, { signal });
  },

  /** Annual series and verdict for a cell (GET /api/trends with latitude and longitude). */
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
