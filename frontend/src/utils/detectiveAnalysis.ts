/**
 * detectiveAnalysis.ts
 * Utilidades científicas para el formateo de coordenadas y clasificación de tendencias.
 */

import type { ClimateVariable } from '../types/climate.types';
import type { MannKendallResult, TrendClassification } from '../types/detective.types';

export function formatCoordinate(val: number, posChar: string, negChar: string): string {
  const dir = val >= 0 ? posChar : negChar;
  return `${Math.abs(val).toFixed(2)}° ${dir}`;
}

export function classifyTrend(variable: ClimateVariable, mk: MannKendallResult): TrendClassification {
  if (!mk.isSignificant) return 'neutral_trend';

  switch (variable) {
    case 'Gistemp':
      return mk.trendDirection === 'increasing' ? 'accelerated_warming' : 'critical_cooling';
    case 'ModisNdvi':
      return mk.trendDirection === 'increasing' ? 'significant_greening' : 'severe_browning';
    case 'GraceMass':
      return mk.trendDirection === 'decreasing' ? 'accelerated_ice_loss' : 'neutral_trend';
    case 'Oco2':
      return mk.trendDirection === 'increasing' ? 'accelerated_warming' : 'neutral_trend';
    default:
      return 'neutral_trend';
  }
}

export interface BadgePresentation {
  label: string;
  badgeClass: string;
  description: string;
}

export function getTrendBadgePresentation(classification: TrendClassification, zScore: number, pValue: number): BadgePresentation {
  const pFormatted = pValue < 0.001 ? '< 0.001' : `= ${pValue.toFixed(3)}`;
  const zFormatted = `Z = ${zScore > 0 ? '+' : ''}${zScore.toFixed(2)}`;

  switch (classification) {
    case 'accelerated_warming':
      return {
        label: 'Calentamiento Acelerado',
        badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
        description: `Tendencia ascendente estadísticamente significativa (${zFormatted}, p ${pFormatted}). Confianza > 99%.`,
      };
    case 'critical_cooling':
      return {
        label: 'Enfriamiento Anómalo',
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
        description: `Tendencia descendente estadísticamente significativa (${zFormatted}, p ${pFormatted}).`,
      };
    case 'significant_greening':
      return {
        label: 'Enverdecimiento Acelerado',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        description: `Aumento vigoroso de biomasa vegetal NDVI (${zFormatted}, p ${pFormatted}).`,
      };
    case 'severe_browning':
      return {
        label: 'Pérdida Crítica de Biomasa',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        description: `Deforestación o degradación vegetal severa (${zFormatted}, p ${pFormatted}).`,
      };
    case 'accelerated_ice_loss':
      return {
        label: 'Pérdida Acelerada de Masa',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]',
        description: `Déficit gravimétrico continuo detectado por satélites GRACE (${zFormatted}, p ${pFormatted}).`,
      };
    default:
      return {
        label: 'Sin Tendencia Significativa',
        badgeClass: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
        description: `Variación dentro del rango estocástico natural (|Z| < 1.96, p ${pFormatted}).`,
      };
  }
}
