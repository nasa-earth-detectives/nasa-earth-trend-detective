import { ClimateVariable } from '../types/climate.types';
import { TrendDirection } from '../types/trend.types';
import { SCIENCE_ACCENTS } from '../config/scienceTheme';

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
