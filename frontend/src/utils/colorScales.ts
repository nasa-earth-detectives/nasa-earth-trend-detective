import { ClimateVariable } from '../types/climate.types';
import { TrendDirection } from '../types/trend.types';

export function getTrendColor(direction: TrendDirection, isSignificant: boolean): string {
  if (!isSignificant) return '#64748b'; // slate-500 si no es estadísticamente significativo

  switch (direction) {
    case 'Increasing':
      return '#ef4444'; // rojo para calentamiento/incremento
    case 'Decreasing':
      return '#3b82f6'; // azul para enfriamiento/disminución
    case 'Stable':
    default:
      return '#10b981'; // esmeralda para estabilidad
  }
}

export function getVariableAccent(variable: ClimateVariable): { primary: string; glow: string } {
  switch (variable) {
    case 'Gistemp':
      return { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    case 'ModisNdvi':
      return { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
    case 'GraceMass':
      return { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' };
    case 'Oco2':
      return { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' };
  }
}
