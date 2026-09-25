/**
 * Cromática científica del instrumento.
 *
 * El chasis de la interfaz es siempre grafito neutro. El único color con
 * saturación es el de la variable observada, de modo que el color comunica
 * qué está midiendo el instrumento y no decora.
 *
 * Tonos minerales y desaturados a propósito: nada de neón.
 */
import { ClimateVariable } from '../types/climate.types';

export interface ScienceAccent {
  /** Color del acento en hexadecimal. */
  accent: string;
  /** Mismo color en componentes RGB, para construir capas translúcidas. */
  rgb: string;
  /** Nombre corto para el indicador contextual fuera del panel. */
  shortLabel: string;
}

export const SCIENCE_ACCENTS: Record<ClimateVariable, ScienceAccent> = {
  // Ámbar quemado: calor sin rojo de videojuego.
  Gistemp: { accent: '#d4834a', rgb: '212, 131, 74', shortLabel: 'Temperatura' },
  // Clorofila apagada, verde vegetal real.
  ModisNdvi: { accent: '#86a05c', rgb: '134, 160, 92', shortLabel: 'Vegetación' },
  // Cian glacial pálido, frío y mineral.
  GraceMass: { accent: '#9dc0d2', rgb: '157, 192, 210', shortLabel: 'Hielo y agua' },
  // Violeta atmosférico contenido.
  Oco2: { accent: '#a38cb9', rgb: '163, 140, 185', shortLabel: 'CO₂' },
};

/** Azul marino reservado para Nivel del Mar cuando la API lo soporte. */
export const SEA_LEVEL_ACCENT = '#5f88a6';

/** Extremos de escalas de observaciones, separados del acento de interfaz. */
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

/** Traduce la variable activa a las variables CSS que consume el instrumento. */
export function applyScienceAccent(variable: ClimateVariable, root: HTMLElement): void {
  const { accent, rgb } = SCIENCE_ACCENTS[variable];

  root.style.setProperty('--active-accent', accent);
  root.style.setProperty('--active-accent-soft', `rgba(${rgb}, 0.22)`);
  root.style.setProperty('--active-accent-glow', `rgba(${rgb}, 0.3)`);
}
