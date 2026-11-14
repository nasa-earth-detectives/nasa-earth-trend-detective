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

const frequency = new Intl.NumberFormat('en', { maximumSignificantDigits: 2 });
const slope = new Intl.NumberFormat('en', { maximumFractionDigits: 3, signDisplay: 'exceptZero' });

/**
 * Statistical verdict indicator. Distinguishes "sustained increase" from
 * "inconclusive change": the backend marks `Stable` when there is no significance,
 * even if the slope is positive, which is misleading in a classroom.
 */
export function TrendSignificanceBadge({ result, variable, unit = '' }: TrendSignificanceBadgeProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const info = describeSignificance(variable, result);
  const Icon = info.tone === 'increase' ? TrendingUp : info.tone === 'decrease' ? TrendingDown : CircleHelp;

  return (
    <span className="significance-badge" data-tone={info.tone}>
      <button type="button" className="significance-badge__trigger focus-ring"
        aria-expanded={open} aria-controls={tooltipId} aria-label={`Statistical verdict: ${info.label}. View details`}
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
            <span>p = {result.pValue < 0.001 ? '< 0.001' : frequency.format(result.pValue)}</span>
            <span>Sen = {slope.format(result.sensSlope)} {unit}</span>
          </span>
        </span>
      )}
    </span>
  );
}
