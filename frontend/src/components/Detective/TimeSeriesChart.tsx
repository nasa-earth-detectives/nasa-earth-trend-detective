import { useState, type CSSProperties } from 'react';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import { intlLocale, useI18n } from '../../i18n';
import { senIntercept, type ProjectedValue } from '../../utils/trendProjection';
import '../../styles/inspection-chart.css';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  unit: string;
  selectedYear?: number;
  onYearSelect?: (year: number) => void;
  accentColor?: string;
  /** Median Sen's slope (°C/year). If provided, the trend line is drawn. */
  senSlope?: number;
  /** The trend carried forward, one entry per year from the last observed one: drawn dashed, inside its range. */
  projection?: ProjectedValue[];
}

/** The slope, if a line can be drawn with it: a finite number and more than one year to cross. */
const usableSlope = (slope: number | undefined, years: number): number | null =>
  (slope !== undefined && Number.isFinite(slope) && years > 1 ? slope : null);

/** The years of a projection from the last observed one on; none without a trend line to carry forward. */
function yearsAhead(projection: ProjectedValue[] | undefined, lastYear: number, slope: number | null): ProjectedValue[] {
  if (slope === null || !projection) return [];
  const ahead = projection.filter(item => item.year >= lastYear);
  return ahead.length > 1 ? ahead : [];
}

interface TrendOverlayProps {
  observations: TimeSeriesDataPoint[];
  slope: number;
  ahead: ProjectedValue[];
  x: (year: number) => number;
  y: (value: number) => number;
}

/** Sen's line across the observed years and, with a projection, its range and the line carried forward. */
function TrendOverlay({ observations, slope, ahead, x, y }: TrendOverlayProps) {
  // Sen's line with its own intercept: the median of what is left of each value after removing the slope.
  const intercept = senIntercept(observations, slope);
  const at = (year: number) => y(intercept + slope * year);
  const first = observations[0].year;
  const last = observations[observations.length - 1].year;
  const band = [...ahead.map(item => `${x(item.year)},${y(item.high)}`),
    ...[...ahead].reverse().map(item => `${x(item.year)},${y(item.low)}`)].join(' ');
  return (
    <>
      <line className="inspection-chart__trend" x1={x(first)} y1={at(first)} x2={x(last)} y2={at(last)} vectorEffect="non-scaling-stroke" />
      {ahead.length > 0 && (
        <>
          <polygon className="inspection-chart__band" points={band} />
          <line className="inspection-chart__projection" x1={x(last)} y1={at(last)}
            x2={x(ahead[ahead.length - 1].year)} y2={at(ahead[ahead.length - 1].year)} vectorEffect="non-scaling-stroke" />
        </>
      )}
    </>
  );
}

/** Lightweight SVG series; the native control preserves keyboard, touch, and accessible readout. */
export function TimeSeriesChart({
  data,
  unit,
  selectedYear,
  onYearSelect,
  accentColor = 'var(--active-accent)',
  senSlope,
  projection,
}: TimeSeriesChartProps) {
  const { locale, t } = useI18n();
  const localeTag = intlLocale(locale);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [localYear, setLocalYear] = useState<number | null>(null);
  const observations = [...data].sort((a, b) => a.year - b.year);

  if (observations.length === 0) {
    return <p className="inspection-chart__empty">{t.inspection.noTimeObservations}</p>;
  }

  const width = 320;
  const height = 120;
  const plot = { left: 34, right: 310, top: 12, bottom: 72 };
  const minYear = observations[0].year;
  const maxYear = observations[observations.length - 1].year;
  const values = observations.map(point => point.value);
  // With a projection the axis runs on to its last year, and the scale makes room for its range.
  const slope = usableSlope(senSlope, observations.length);
  const ahead = yearsAhead(projection, maxYear, slope);
  const horizon = Math.max(maxYear, ...ahead.map(item => item.year));
  const minValue = Math.min(...values, ...ahead.map(item => item.low));
  const maxValue = Math.max(...values, ...ahead.map(item => item.high));
  const yearSpan = horizon - minYear || 1;
  const getX = (year: number) => plot.left + ((year - minYear) / yearSpan) * (plot.right - plot.left);
  const getY = (value: number) => maxValue === minValue
    ? (plot.top + plot.bottom) / 2
    : plot.bottom - ((value - minValue) / (maxValue - minValue)) * (plot.bottom - plot.top);
  const points = observations.map(point => `${getX(point.year)},${getY(point.value)}`).join(' ');
  const clampY = (value: number) => Math.min(plot.bottom, Math.max(plot.top, value));
  const requestedYear = selectedYear ?? localYear ?? maxYear;
  const selectedIndex = observations.reduce((nearest, point, index) =>
    Math.abs(point.year - requestedYear) < Math.abs(observations[nearest].year - requestedYear) ? index : nearest, 0);
  const selectedPoint = observations[selectedIndex];
  const activePoint = observations.find(point => point.year === hoveredYear) ?? selectedPoint;
  const formatValue = (value: number) => value.toLocaleString(localeTag, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="inspection-chart" style={{ '--chart-accent': accentColor } as CSSProperties}>
      <div className="inspection-chart__plot">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {[...new Set([minValue, maxValue])].map(value => (
            <g key={value}>
              <line className="inspection-chart__guide" x1={plot.left} y1={getY(value)} x2={plot.right} y2={getY(value)} />
              <text className="inspection-chart__axis" x={plot.left - 7} y={getY(value) + 3} textAnchor="end">
                {value.toLocaleString(localeTag, { maximumFractionDigits: 1 })}
              </text>
            </g>
          ))}
          <polyline className="inspection-chart__line" points={points} vectorEffect="non-scaling-stroke" />
          {slope !== null && (
            <TrendOverlay observations={observations} slope={slope} ahead={ahead} x={getX} y={value => clampY(getY(value))} />
          )}
          <line className="inspection-chart__cursor" x1={getX(activePoint.year)} y1={plot.top} x2={getX(activePoint.year)} y2={plot.bottom + 5} />
          <circle className="inspection-chart__point" cx={getX(activePoint.year)} cy={getY(activePoint.value)} r="3.5" />
          {observations.map((point, index) => {
            const left = index === 0 ? plot.left : (getX(observations[index - 1].year) + getX(point.year)) / 2;
            // The last observed year ends where the projection starts, not at the edge of the plot.
            const right = index === observations.length - 1 ? Math.min(plot.right, 2 * getX(point.year) - left + 1)
              : (getX(point.year) + getX(observations[index + 1].year)) / 2;
            return (
              <rect
                key={point.year}
                className="inspection-chart__hit"
                x={left}
                y="0"
                width={Math.max(right - left, 1)}
                height={plot.bottom + 4}
                onMouseEnter={() => setHoveredYear(point.year)}
                onMouseLeave={() => setHoveredYear(null)}
                onClick={() => {
                  setLocalYear(point.year);
                  onYearSelect?.(point.year);
                }}
              />
            );
          })}
          <text className="inspection-chart__axis" x={plot.left} y="117" textAnchor="start">{minYear}</text>
          {minYear !== maxYear && <text className="inspection-chart__axis" x={getX(maxYear)} y="117" textAnchor="end">{maxYear}</text>}
          {ahead.length > 0 && <text className="inspection-chart__axis inspection-chart__axis--ahead" x={plot.right} y="117" textAnchor="end">{horizon}</text>}
        </svg>
        <input
          className="inspection-chart__range"
          // The slider only covers the observed years: with a projection they end before the right edge.
          style={{ width: `${86.25 * (maxYear - minYear || 1) / yearSpan}%` }}
          type="range"
          min="0"
          max={Math.max(observations.length - 1, 1)}
          step="1"
          value={selectedIndex}
          disabled={observations.length === 1}
          aria-label={t.inspection.seriesYearAria}
          aria-valuetext={`${selectedPoint.year}: ${formatValue(selectedPoint.value)} ${unit}`}
          onFocus={() => setHoveredYear(null)}
          onChange={event => {
            const point = observations[Number(event.target.value)];
            setHoveredYear(null);
            setLocalYear(point.year);
            onYearSelect?.(point.year);
          }}
        />
      </div>
      <div className="inspection-chart__readout">
        <span>{t.inspection.yearLabel} <strong>{activePoint.year}</strong></span>
        <span><strong>{formatValue(activePoint.value)}</strong> {unit}</span>
      </div>
    </div>
  );
}
