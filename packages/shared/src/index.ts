/**
 * NASA Earth System Trend Detective - Shared Domain Contracts
 */

export enum EarthVariableType {
  SurfaceTemperature = 'GISTEMP_SURFACE_TEMP',
  VegetationNdvi = 'MODIS_VEGETATION_NDVI',
  IceMassAnomaly = 'GRACE_ICE_MASS_ANOMALY',
  CarbonDioxide = 'OCO2_CARBON_DIOXIDE',
  SeaLevelAnomaly = 'SENTINEL_SEA_LEVEL',
}

export enum TrendSignificanceStatus {
  StatisticallySignificantIncreasing = 'SIGNIFICANT_INCREASING',
  StatisticallySignificantDecreasing = 'SIGNIFICANT_DECREASING',
  NonSignificant = 'NON_SIGNIFICANT',
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface TimeSeriesObservation {
  year: number;
  value: number;
  anomalyZScore: number;
}

export interface MannKendallResult {
  sStatistic: number;
  varianceS: number;
  zScore: number;
  pValue: number;
  sensSlopePerDecade: number;
  significance: TrendSignificanceStatus;
  isSignificantAt95: boolean;
}

export interface RegionalTrendSummary {
  regionId: string;
  regionName: string;
  center: GeoCoordinate;
  variable: EarthVariableType;
  startYear: number;
  endYear: number;
  observations: TimeSeriesObservation[];
  stats: MannKendallResult;
}

export interface OpposingTrendPair {
  driverProcess: string;
  increasingRegion: RegionalTrendSummary;
  decreasingRegion: RegionalTrendSummary;
  divergenceIndex: number;
}
