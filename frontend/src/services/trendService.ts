import { getJson } from './apiClient';
import { ClimateObservation, ClimateVariable } from '../types/climate.types';
import { TrendFilterParams } from '../types/trend.types';

export interface CellTrendQuery {
  variable: ClimateVariable;
  startYear: number;
  endYear: number;
  latitude: number;
  longitude: number;
  /** Half-sizes of the box of a whole region; left out, the API analyses the 2° around the point. */
  latitudeRadius?: number;
  longitudeRadius?: number;
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
    const { latitudeRadius, longitudeRadius, ...point } = query;
    const params: Record<string, string | number> = { ...point };
    if (latitudeRadius !== undefined && longitudeRadius !== undefined) {
      params.latitudeRadius = latitudeRadius;
      params.longitudeRadius = longitudeRadius;
    }
    return getJson<unknown>('/trends', params, { signal });
  },

  async getObservations(variable: ClimateVariable, year: number, signal?: AbortSignal): Promise<ClimateObservation[]> {
    return getJson<ClimateObservation[]>('/trends/observations', {
      variable,
      year,
    }, { signal });
  },
};
