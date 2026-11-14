/**
 * A cell (<td>) of the case board: the real series of a variable in a region, with its slope
 * and verdict. It receives no pre-baked figures: only what the API just returned.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { CaseVerdict } from '../../hooks/useOpposingCases';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import { verdictTone } from '../../utils/caseVerdict';

const WIDTH = 132;
const HEIGHT = 36;
const perDecade = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const probability = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2 });

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
  const tone = verdictTone(verdict);
  if (verdict?.status !== 'ready') {
    return (
      <td>
        <div className="case-cell" data-tone={tone}>
          <p className="case-cell__empty">{verdict?.status === 'error' ? 'Data connection unavailable' : 'Computing from real series…'}</p>
        </div>
      </td>
    );
  }
  const { trend } = verdict;
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  const reading = tone === 'up' ? 'Rising' : tone === 'down' ? 'Falling' : 'No conclusive trend';
  const p = trend.pValue < 0.001 ? 'p < 0.001' : `p = ${probability.format(trend.pValue)}`;
  return (
    <td>
      <div className="case-cell" data-tone={tone}>
        <Sparkline series={trend.series} slope={trend.sensSlope} />
        <p className="case-cell__slope"><strong>{perDecade.format(trend.sensSlope * 10)}</strong><span>{unit} per decade</span></p>
        <p className="case-cell__verdict"><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{reading}<span>{p}</span></p>
        <button type="button" className="case-cell__open focus-ring" onClick={onOpen}
          aria-label={`View ${placeLabel} on the globe`}>View on globe</button>
      </div>
    </td>
  );
}
