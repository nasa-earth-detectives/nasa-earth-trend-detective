/**
 * detective.types.ts
 * Tipos de datos para el Inspector de Detective y análisis estadístico Mann-Kendall.
 * Cumple con estándares científicos no paramétricos de la NASA.
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
  /** Puntuación Z estandarizada: |Z| >= 1.96 indica significancia al 95% de confianza (p < 0.05). */
  zScore: number;
  /** Nivel de significancia p-value bilateral. */
  pValue: number;
  /** Pendiente mediana de Sen (Q): tasa anual no paramétrica de cambio. */
  senSlope: number;
  /** Coeficiente de correlación de rango Tau de Kendall (-1 a 1). */
  tau: number;
  /** Booleano indicador de confianza estadística. */
  isSignificant: boolean;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface TimeSeriesDataPoint {
  year: number;
  value: number;
  /** Valor proyectado según la recta mediana de la Pendiente de Sen. */
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
