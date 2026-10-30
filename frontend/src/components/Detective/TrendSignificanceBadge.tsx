import { useId, useState } from 'react';
import { CircleHelp, TrendingDown, TrendingUp } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import { describeSignificance, type SignificanceInput } from '../../utils/detectiveAnalysis';
import '../../styles/significance-badge.css';

interface TrendSignificanceBadgeProps {
  result: SignificanceInput;
  variable: ClimateVariable;
  unit?: string;
}

const frequency = new Intl.NumberFormat('es', { maximumSignificantDigits: 2 });
const slope = new Intl.NumberFormat('es', { maximumFractionDigits: 3, signDisplay: 'exceptZero' });

/**
 * Semáforo del veredicto estadístico. Distingue "aumento sostenido" de
 * "sin cambio concluyente": el backend marca `Stable` cuando no hay significancia,
 * aunque la pendiente sea positiva, y eso se lee mal en un aula.
 */
export function TrendSignificanceBadge({ result, variable, unit = '' }: TrendSignificanceBadgeProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const info = describeSignificance(variable, result);
  const Icon = info.tone === 'increase' ? TrendingUp : info.tone === 'decrease' ? TrendingDown : CircleHelp;

  return (
    <span className="significance-badge" data-tone={info.tone}>
      <button type="button" className="significance-badge__trigger focus-ring"
        aria-expanded={open} aria-controls={tooltipId} aria-label={`Veredicto estadístico: ${info.label}. Ver detalle`}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onClick={() => setOpen(value => !value)}>
        <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
        <span>{info.label}</span>
      </button>
      {open && (
        <span role="tooltip" id={tooltipId} className="significance-badge__tooltip">
          <strong>{info.claim}</strong>
          <span>{info.caveat}</span>
          <span className="significance-badge__figures">
            {result.zScore !== undefined && <span>Z = {result.zScore >= 0 ? '+' : ''}{frequency.format(result.zScore)}</span>}
            <span>p = {result.pValue < 0.001 ? '< 0,001' : frequency.format(result.pValue)}</span>
            <span>Sen = {slope.format(result.sensSlope)} {unit}</span>
          </span>
        </span>
      )}
    </span>
  );
}
