import { Color, SRGBColorSpace } from 'three';
import { ClimateObservation, ClimateVariable } from '../types/climate.types';
import { TrendDirection } from '../types/trend.types';
import { SCIENCE_ACCENTS, SCIENCE_SURFACE_COLORS } from '../config/scienceTheme';

export interface ObservationScale {
  readonly domain: readonly [number, number];
  readonly midpoint: number;
  readonly unit: string;
  readonly label: string;
  readonly stops: readonly [string, string, string];
  /** Visual contrast around the reference value; does not transform values or heights. */
  readonly colorContrastPower?: number;
}

/** Fixed presentation domains: these are not scientific significance thresholds. */
export const OBSERVATION_SCALES: Record<ClimateVariable, ObservationScale> = {
  Gistemp: {
    domain: [-2, 2], midpoint: 0, unit: '°C', label: 'Temperature anomaly',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.cold, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.hot],
  },
  ModisNdvi: {
    domain: [0, 1], midpoint: 0.5, unit: 'NDVI', label: 'Vegetation index',
    stops: [SCIENCE_SURFACE_COLORS.drySoil, SCIENCE_ACCENTS.ModisNdvi.accent, SCIENCE_SURFACE_COLORS.chlorophyll],
  },
  // 90th percentile of measured absolute value in 2025 (49 cm). Ice sheets are intentionally outside
  // the scale (99th percentile: 406 cm): including them would wash out color across the rest of the planet.
  GraceMass: {
    domain: [-50, 50], midpoint: 0, unit: 'cm H₂O eq.', label: 'Water & ice anomaly · 2004–2009 baseline',
    stops: [SCIENCE_SURFACE_COLORS.waterDeficit, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  // Range measured in OCO-2 annual means: from 396 ppm (2015 minimum) to 429 ppm (2025 maximum).
  Oco2: {
    domain: [395, 430], midpoint: 412.5, unit: 'ppm', label: 'CO₂ concentration · column average',
    stops: [SCIENCE_SURFACE_COLORS.co2Baseline, SCIENCE_ACCENTS.Oco2.accent, SCIENCE_SURFACE_COLORS.co2Elevated],
  },
  // MERRA-2: annual anomaly relative to 1991-2020. Each domain is the 99th percentile of the absolute value
  // measured in the loaded data (2.50 °C; 2.17 and 0.93 mm/day; 0.147), not a scientific threshold.
  Merra2Temperature: {
    domain: [-2.5, 2.5], midpoint: 0, unit: '°C', label: 'Air temperature anomaly · 1991–2020 baseline',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.cold, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.hot],
  },
  Merra2Precipitation: {
    domain: [-2, 2], midpoint: 0, unit: 'mm/day', label: 'Precipitation anomaly · 1991–2020 baseline',
    colorContrastPower: 0.6,
    stops: [SCIENCE_SURFACE_COLORS.waterDeficit, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  GpmPrecipitation: {
    domain: [-2, 2], midpoint: 0, unit: 'mm/day', label: 'Precipitation anomaly (satellite) · 2001–2020 baseline',
    colorContrastPower: 0.6,
    stops: [SCIENCE_SURFACE_COLORS.waterDeficit, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  Merra2Evaporation: {
    domain: [-0.9, 0.9], midpoint: 0, unit: 'mm/day', label: 'Evaporation anomaly · 1991–2020 baseline',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.drySoil, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  Merra2SoilMoisture: {
    domain: [-0.15, 0.15], midpoint: 0, unit: 'fraction', label: 'Soil moisture anomaly · 1991–2020 baseline',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.drySoil, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.chlorophyll],
  },
};

const referenceColors = Object.fromEntries(Object.entries(OBSERVATION_SCALES)
  .map(([key, scale]) => [key, scale.stops.map(stop => new Color(stop).convertLinearToSRGB())])) as Record<ClimateVariable, Color[]>;
const cssColor = new Color();

/** Never confuses an annual observation with an annual rate of change. */
export function getObservationValue(observation: ClimateObservation): number {
  // NDVI and CO₂ are read as absolute values; the rest, as difference relative to their baseline period.
  return observation.variable === 'ModisNdvi' || observation.variable === 'Oco2'
    ? observation.value : observation.anomaly ?? observation.value;
}

export function sampleObservationColor(variable: ClimateVariable, value: number, target = new Color()): Color {
  if (!Number.isFinite(value)) throw new RangeError('Scale requires a finite observation.');
  const { domain: [minimum, maximum], midpoint, colorContrastPower = 1 } = OBSERVATION_SCALES[variable];
  const clamped = Math.min(maximum, Math.max(minimum, value));
  const colors = referenceColors[variable];
  const endpoint = clamped < midpoint ? 0 : 2;
  const span = endpoint === 0 ? midpoint - minimum : maximum - midpoint;
  const strength = (Math.abs(clamped - midpoint) / span) ** colorContrastPower;
  return target.copy(colors[1]).lerp(colors[endpoint], strength).convertSRGBToLinear();
}

export function observationColorCss(variable: ClimateVariable, value: number, alpha = 1): string {
  sampleObservationColor(variable, value, cssColor);
  const rgb = cssColor.getRGB({ r: 0, g: 0, b: 0 }, SRGBColorSpace);
  return `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${Math.min(1, Math.max(0, alpha))})`;
}

export function observationMagnitude(variable: ClimateVariable, value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Height requires a finite observation.');
  const [minimum, maximum] = OBSERVATION_SCALES[variable].domain;
  return Math.min(1, Math.max(0, minimum < 0 ? Math.abs(value) / Math.max(Math.abs(minimum), maximum)
    : (value - minimum) / (maximum - minimum)));
}

export function getTrendColor(direction: TrendDirection, isSignificant: boolean): string {
  if (!isSignificant) return '#6e757d'; // mineral gray if not statistically significant

  switch (direction) {
    case 'Increasing':
      return '#c8703f'; // burnt amber for increase
    case 'Decreasing':
      return '#5f88a6'; // slate blue for decrease
    case 'Stable':
    default:
      return '#86a05c'; // mineral green for stability
  }
}

/**
 * Chromatic accent for each scientific variable.
 *
 * Delegates to `SCIENCE_ACCENTS` so there is a single scientific color
 * catalog across the entire frontend.
 */
export function getVariableAccent(variable: ClimateVariable): { primary: string; glow: string } {
  const { accent, rgb } = SCIENCE_ACCENTS[variable];

  return { primary: accent, glow: `rgba(${rgb}, 0.3)` };
}
