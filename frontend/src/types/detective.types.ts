/**
 * detective.types.ts
 * Data types for Detective Inspector and Mann-Kendall statistical analysis.
 * Complies with NASA non-parametric scientific standards.
 */

import type { ClimateVariable } from './climate.types';

export type TrendClassification =
  | 'accelerated_warming'
  | 'critical_cooling'
  | 'significant_greening'
  | 'severe_browning'
  | 'accelerated_ice_loss'
  | 'neutral_trend';

export interface MannKendallResult {
  /** Standardized Z-score: |Z| >= 1.96 indicates significance at 95% confidence (p < 0.05). */
  zScore: number;
  /** Two-tailed p-value significance level. */
  pValue: number;
  /** Sen's median slope (Q): non-parametric annual rate of change. */
  senSlope: number;
  /** Kendall's tau rank correlation coefficient (-1 to 1). */
  tau: number;
  /** Boolean indicator of statistical significance. */
  isSignificant: boolean;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface TimeSeriesDataPoint {
  year: number;
  value: number;
  /** Projected value based on the Sen's slope median trendline. */
  fittedValue?: number;
}

export interface DetectiveInspectionData {
  lat: number;
  lng: number;
  regionName: string;
  variable: ClimateVariable;
  currentYear: number;
  currentValue: number;
  unit: string;
  baselineAnomaly: number;
  mannKendall: MannKendallResult;
  history: TimeSeriesDataPoint[];
}
