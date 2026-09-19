import { getJson } from './apiClient';
import { ClimateObservation, ClimateVariable } from '../types/climate.types';
import { TrendAnalysisResult, TrendFilterParams } from '../types/trend.types';

export const trendService = {
  async getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    return getJson<{ status: string; service: string; timestamp: string }>('/health');
  },

  async getTrends(params: TrendFilterParams): Promise<TrendAnalysisResult[]> {
    return getJson<TrendAnalysisResult[]>('/trends', {
      variable: params.variable,
      startYear: params.startYear,
      endYear: params.endYear,
    });
  },

  async getObservations(variable: ClimateVariable, year: number): Promise<ClimateObservation[]> {
    return getJson<ClimateObservation[]>('/trends/observations', {
      variable,
      year,
    });
  },
};
