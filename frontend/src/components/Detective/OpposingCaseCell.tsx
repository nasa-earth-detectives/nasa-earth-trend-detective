/**
 * A cell (<td>) in the case board: the real series for one variable in one region, with its slope
 * and verdict. Receives no precomputed figures: only what the API just returned.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { CaseVerdict } from '../../hooks/useOpposingCases';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import { verdictTone } from '../../utils/caseVerdict';
import { formatTemplate, intlLocale, useI18n } from '../../i18n';

const WIDTH = 132;
const HEIGHT = 36;

/** Annual series and Sen line (passes through the median of residuals, as defined by the estimator). */
function Sparkline({ series, slope }: { series: TimeSeriesDataPoint[]; slope: number }) {
  if (series.length < 2) return null;
  const firstYear = series[0].year;
  const lastYear = series[series.length - 1].year;
  const values = series.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (year: number) => ((year - firstYear) / (lastYear - firstYear)) * WIDTH;
  const y = (value: number) => HEIGHT - 3 - ((value - min) / (max - min || 1)) * (HEIGHT - 6);
  const residuals = series.map(point => point.value - slope * (point.year - firstYear)).sort((a, b) => a - b);
  const intercept = residuals[Math.floor(residuals.length / 2)];
  const path = series.map((point, index) => `${index ? 'L' : 'M'}${x(point.year).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  return (
    <svg className="case-cell__spark" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} aria-hidden="true">
      <path d={path} className="case-cell__series" />
      <line x1={0} y1={y(intercept)} x2={WIDTH} y2={y(intercept + slope * (lastYear - firstYear))} className="case-cell__sen" />
    </svg>
  );
}

interface OpposingCaseCellProps {
  verdict: CaseVerdict | undefined;
  /** Value unit, e.g. "mm/day"; slope is shown per decade. */
  unit: string;
  placeLabel: string;
  onOpen: () => void;
}

export function OpposingCaseCell({ verdict, unit, placeLabel, onOpen }: OpposingCaseCellProps) {
  const { locale, t } = useI18n();
  const perDecade = new Intl.NumberFormat(intlLocale(locale), { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
  const probability = new Intl.NumberFormat(intlLocale(locale), { maximumSignificantDigits: 2 });
  const tone = verdictTone(verdict);
  if (verdict?.status !== 'ready') {
    return (
      <td>
        <div className="case-cell" data-tone={tone}>
          <p className="case-cell__empty">{verdict?.status === 'error' ? t.modals.cellUnavailable : t.modals.cellComputing}</p>
        </div>
      </td>
    );
  }
  const { trend } = verdict;
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  const reading = tone === 'up' ? t.modals.cellRising : tone === 'down' ? t.modals.cellFalling : t.modals.cellNoConclusive;
  // Display the strictest p-value available: the one that accounts for year-to-year persistence.
  const pValue = trend.prewhitened?.pValue ?? trend.pValue;
  const p = pValue < 0.001 ? 'p < 0.001' : `p = ${probability.format(pValue)}`;
  return (
    <td>
      <div className="case-cell" data-tone={tone}>
        <Sparkline series={trend.series} slope={trend.sensSlope} />
        <p className="case-cell__slope"><strong>{perDecade.format(trend.sensSlope * 10)}</strong><span>{formatTemplate(t.modals.cellPerDecade, { unit })}</span></p>
        <p className="case-cell__verdict"><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{reading}<span>{p}</span></p>
        <button type="button" className="case-cell__open focus-ring" onClick={onOpen}
          aria-label={formatTemplate(t.modals.cellViewAria, { place: placeLabel })}>{t.modals.cellViewOnGlobe}</button>
      </div>
    </td>
  );
}
