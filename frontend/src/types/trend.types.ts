import { ClimateVariable } from './climate.types';

export type TrendDirection = 'Increasing' | 'Decreasing' | 'Stable';

export interface TrendAnalysisResult {
  variable: ClimateVariable;
  latitude: number;
  longitude: number;
  startYear: number;
  endYear: number;
  sensSlope: number;
  mannKendallZ: number;
  pValue: number;
  isSignificant: boolean;
  direction: TrendDirection;
  confidenceInterval95: [number, number];
}

export interface TrendFilterParams {
  variable: ClimateVariable;
  startYear: number;
  endYear: number;
  minConfidence?: number;
}
