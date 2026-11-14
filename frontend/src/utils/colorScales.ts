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
  /** Contraste visual alrededor de la referencia; no transforma valores ni alturas. */
  readonly colorContrastPower?: number;
}

/** Dominios fijos de presentación: no son umbrales de significancia científica. */
export const OBSERVATION_SCALES: Record<ClimateVariable, ObservationScale> = {
  Gistemp: {
    domain: [-2, 2], midpoint: 0, unit: '°C', label: 'Anomalía de temperatura',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.cold, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.hot],
  },
  ModisNdvi: {
    domain: [0, 1], midpoint: 0.5, unit: 'NDVI', label: 'Índice de vegetación',
    stops: [SCIENCE_SURFACE_COLORS.drySoil, SCIENCE_ACCENTS.ModisNdvi.accent, SCIENCE_SURFACE_COLORS.chlorophyll],
  },
  GraceMass: {
    domain: [-30, 30], midpoint: 0, unit: 'cm H₂O eq.', label: 'Anomalía de agua y hielo',
    stops: [SCIENCE_SURFACE_COLORS.waterDeficit, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  Oco2: {
    domain: [360, 450], midpoint: 420, unit: 'ppm', label: 'Concentración de CO₂',
    stops: [SCIENCE_SURFACE_COLORS.co2Baseline, SCIENCE_ACCENTS.Oco2.accent, SCIENCE_SURFACE_COLORS.co2Elevated],
  },
  // MERRA-2: anomalía anual respecto a 1991-2020. Cada dominio es el percentil 99 del valor absoluto
  // medido en los datos cargados (2,50 °C; 2,17 y 0,93 mm/día; 0,147), no un umbral científico.
  Merra2Temperature: {
    domain: [-2.5, 2.5], midpoint: 0, unit: '°C', label: 'Anomalía de temperatura del aire · base 1991–2020',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.cold, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.hot],
  },
  Merra2Precipitation: {
    domain: [-2, 2], midpoint: 0, unit: 'mm/día', label: 'Anomalía de precipitación · base 1991–2020',
    colorContrastPower: 0.6,
    stops: [SCIENCE_SURFACE_COLORS.waterDeficit, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  GpmPrecipitation: {
    domain: [-2, 2], midpoint: 0, unit: 'mm/día', label: 'Anomalía de precipitación (satélite) · base 2001–2020',
    colorContrastPower: 0.6,
    stops: [SCIENCE_SURFACE_COLORS.waterDeficit, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  Merra2Evaporation: {
    domain: [-0.9, 0.9], midpoint: 0, unit: 'mm/día', label: 'Anomalía de evaporación · base 1991–2020',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.drySoil, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.glacier],
  },
  Merra2SoilMoisture: {
    domain: [-0.15, 0.15], midpoint: 0, unit: 'fracción', label: 'Anomalía de humedad del suelo · base 1991–2020',
    colorContrastPower: 0.65,
    stops: [SCIENCE_SURFACE_COLORS.drySoil, SCIENCE_SURFACE_COLORS.neutral, SCIENCE_SURFACE_COLORS.chlorophyll],
  },
};

const referenceColors = Object.fromEntries(Object.entries(OBSERVATION_SCALES)
  .map(([key, scale]) => [key, scale.stops.map(stop => new Color(stop).convertLinearToSRGB())])) as Record<ClimateVariable, Color[]>;
const cssColor = new Color();

/** No confunde una observación anual con una pendiente de cambio por año. */
export function getObservationValue(observation: ClimateObservation): number {
  // NDVI y CO₂ se leen en valor absoluto; el resto, como diferencia respecto a su periodo base.
  return observation.variable === 'ModisNdvi' || observation.variable === 'Oco2'
    ? observation.value : observation.anomaly ?? observation.value;
}

export function sampleObservationColor(variable: ClimateVariable, value: number, target = new Color()): Color {
  if (!Number.isFinite(value)) throw new RangeError('La escala requiere una observación finita.');
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
  if (!Number.isFinite(value)) throw new RangeError('La altura requiere una observación finita.');
  const [minimum, maximum] = OBSERVATION_SCALES[variable].domain;
  return Math.min(1, Math.max(0, minimum < 0 ? Math.abs(value) / Math.max(Math.abs(minimum), maximum)
    : (value - minimum) / (maximum - minimum)));
}

export function getTrendColor(direction: TrendDirection, isSignificant: boolean): string {
  if (!isSignificant) return '#6e757d'; // gris mineral si no es estadísticamente significativo

  switch (direction) {
    case 'Increasing':
      return '#c8703f'; // ámbar quemado para incremento
    case 'Decreasing':
      return '#5f88a6'; // azul marino para descenso
    case 'Stable':
    default:
      return '#86a05c'; // verde mineral para estabilidad
  }
}

/**
 * Acento cromático de cada variable científica.
 *
 * Delega en `SCIENCE_ACCENTS` para que exista un único catálogo de color
 * científico en todo el frontend.
 */
export function getVariableAccent(variable: ClimateVariable): { primary: string; glow: string } {
  const { accent, rgb } = SCIENCE_ACCENTS[variable];

  return { primary: accent, glow: `rgba(${rgb}, 0.3)` };
}
