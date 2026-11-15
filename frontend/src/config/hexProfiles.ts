import type { ClimateVariable } from '../types/climate.types';

/**
 * Vertical scale of the trend columns per variable. Each domain comes from the slopes measured in the
 * real data, so most cells use the scale without a few extremes flattening the rest. They are
 * presentation choices, not scientific thresholds; a cell above its domain is drawn clipped and the
 * readout says so, with its real value.
 */
export const HEX_VARIABLE_PROFILES: Record<ClimateVariable, { unit: string; heightDomain: number }> = {
  Gistemp: { unit: '°C / year', heightDomain: 0.08 },
  // 99th percentile of measured slope in real 2000-2025 NDVI: 0.0046 per year.
  ModisNdvi: { unit: 'NDVI / year', heightDomain: 0.005 },
  // Measured slope in GRACE 2002-2025: 90th percentile = 2.5 cm/yr; 99th percentile = 22 (ice sheets, which
  // exceed the scale and are labeled accordingly in the readout).
  GraceMass: { unit: 'cm H₂O eq. / year', heightDomain: 3 },
  // Measured slope in OCO-2 2015-2025: 2.30 to 2.70 ppm per year (median 2.47).
  Oco2: { unit: 'ppm / year', heightDomain: 3 },
  // MERRA-2: 99th percentile of the slope measured in real 1981-2025 data
  // (0.081 °C; 0.046, 0.029, and 0.0043 per year).
  Merra2Temperature: { unit: '°C / year', heightDomain: 0.08 },
  Merra2Precipitation: { unit: 'mm/day / year', heightDomain: 0.045 },
  Merra2Evaporation: { unit: 'mm/day / year', heightDomain: 0.03 },
  Merra2SoilMoisture: { unit: 'fraction / year', heightDomain: 0.0045 },
  // Same domain as MERRA-2 precipitation so both can be compared at a glance.
  GpmPrecipitation: { unit: 'mm/day / year', heightDomain: 0.045 },
};
