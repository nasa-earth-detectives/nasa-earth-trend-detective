/**
 * Scientific color palette of the instrument.
 *
 * The interface chassis is always neutral graphite. The only saturated
 * color is that of the observed variable, so that color communicates
 * what the instrument is measuring rather than decorating.
 *
 * Mineral and purposefully desaturated tones: no neon.
 */
import { ClimateVariable } from '../types/climate.types';

export interface ScienceAccent {
  /** Accent color in hexadecimal. */
  accent: string;
  /** Same color in RGB components, for constructing translucent layers. */
  rgb: string;
  /** Short label for contextual indicator outside the panel. */
  shortLabel: string;
}

export const SCIENCE_ACCENTS: Record<ClimateVariable, ScienceAccent> = {
  // Burnt amber: warmth without video-game red.
  Gistemp: { accent: '#d4834a', rgb: '212, 131, 74', shortLabel: 'Temperature' },
  // Muted chlorophyll, real plant green.
  ModisNdvi: { accent: '#86a05c', rgb: '134, 160, 92', shortLabel: 'Vegetation' },
  // Pale glacial cyan, cold and mineral.
  GraceMass: { accent: '#9dc0d2', rgb: '157, 192, 210', shortLabel: 'Water & Ice' },
  // Restrained atmospheric violet.
  Oco2: { accent: '#a38cb9', rgb: '163, 140, 185', shortLabel: 'CO₂' },
};

/** Deep navy reserved for Sea Level when the API supports it. */
export const SEA_LEVEL_ACCENT = '#5f88a6';

/** Extrema of observation scales, separate from the interface accent. */
export const SCIENCE_SURFACE_COLORS = {
  cold: '#267edf',
  neutral: '#aaa99d',
  hot: '#e44f46',
  drySoil: '#b28a56',
  chlorophyll: '#397c56',
  waterDeficit: '#bb735c',
  glacier: '#467f9e',
  co2Baseline: '#84935a',
  co2Elevated: '#a565aa',
} as const;

/** Translates the active variable to CSS variables consumed by the instrument. */
export function applyScienceAccent(variable: ClimateVariable, root: HTMLElement): void {
  const { accent, rgb } = SCIENCE_ACCENTS[variable];

  root.style.setProperty('--active-accent', accent);
  root.style.setProperty('--active-accent-soft', `rgba(${rgb}, 0.22)`);
  root.style.setProperty('--active-accent-glow', `rgba(${rgb}, 0.3)`);
}
