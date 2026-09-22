/**
 * TrendSignificanceBadge.tsx
 * Componente visual para badges de significancia estadística (Mann-Kendall |Z| >= 1.96).
 * Cumple con S2-T5.2 del Sprint 2.
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { MannKendallResult } from '../../types/detective.types';
import { classifyTrend, getTrendBadgePresentation } from '../../utils/detectiveAnalysis';

interface TrendSignificanceBadgeProps {
  result: MannKendallResult;
  variable: ClimateVariable;
  unit?: string;
}

export function TrendSignificanceBadge({ result, variable, unit = '' }: TrendSignificanceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const classification = classifyTrend(variable, result);
  const info = getTrendBadgePresentation(classification, result.zScore, result.pValue);

  const getTrendIcon = () => {
    if (!result.isSignificant) return <AlertCircle size={13} className="text-slate-400" />;
    return result.trendDirection === 'increasing'
      ? <TrendingUp size={13} className="text-red-400" />
      : <TrendingDown size={13} className="text-cyan-400" />;
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-300 cursor-help ${info.badgeClass}`}
        aria-label={`Estado estadístico: ${info.label}`}
      >
        {getTrendIcon()}
        <span>{info.label}</span>
      </button>

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 rounded-lg bg-slate-900/95 border border-slate-700/60 shadow-2xl backdrop-blur-md text-[11px] text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Test de Mann-Kendall
          </p>
          <p className="text-slate-400 leading-relaxed mb-2">{info.description}</p>
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-300">
            <div>
              <span className="text-slate-500">Z-Score:</span> {result.zScore > 0 ? '+' : ''}{result.zScore.toFixed(2)}
            </div>
            <div>
              <span className="text-slate-500">p-value:</span> {result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(3)}
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Pendiente Sen (Q):</span> {result.senSlope > 0 ? '+' : ''}{result.senSlope.toFixed(4)} {unit}/año
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
