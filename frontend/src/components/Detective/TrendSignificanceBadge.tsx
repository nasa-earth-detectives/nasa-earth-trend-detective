import { useId, useState } from 'react';
import { CircleHelp, TrendingDown, TrendingUp } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { SignificanceInput } from '../../utils/detectiveAnalysis';
import '../../styles/significance-badge.css';

import { describeSignificanceLocalized, formatNumber, formatTemplate, useI18n } from '../../i18n';

interface TrendSignificanceBadgeProps {
  result: SignificanceInput;
  variable: ClimateVariable;
  unit?: string;
}

/**
 * Statistical verdict indicator. Distinguishes "sustained increase" from
 * "inconclusive change": the backend marks `Stable` when there is no significance,
 * even if the slope is positive, which is misleading in a classroom.
 */
export function TrendSignificanceBadge({ result, variable, unit = '' }: TrendSignificanceBadgeProps) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const info = describeSignificanceLocalized(variable, result, locale);
  const Icon = info.tone === 'increase' ? TrendingUp : info.tone === 'decrease' ? TrendingDown : CircleHelp;

  return (
    <span className="significance-badge" data-tone={info.tone}>
      <button type="button" className="significance-badge__trigger focus-ring"
        aria-expanded={open} aria-controls={tooltipId} aria-label={formatTemplate(t.inspection.verdictTriggerAria, { label: info.label })}
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
            {result.zScore !== undefined && <span>Z = {result.zScore >= 0 ? '+' : ''}{formatNumber(result.zScore, 'sig2', locale)}</span>}
            <span>p = {result.pValue < 0.001 ? '< 0.001' : formatNumber(result.pValue, 'sig2', locale)}</span>
            <span>Sen = {formatNumber(result.sensSlope, 'signedMaxDec3', locale)} {unit}</span>
          </span>
        </span>
      )}
    </span>
  );
}
