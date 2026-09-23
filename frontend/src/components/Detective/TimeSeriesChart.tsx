import { useState, type CSSProperties } from 'react';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import '../../styles/inspection-chart.css';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  unit: string;
  selectedYear?: number;
  onYearSelect?: (year: number) => void;
  accentColor?: string;
}

/** Serie SVG ligera; el control nativo conserva teclado, tacto y lectura accesible. */
export function TimeSeriesChart({
  data,
  unit,
  selectedYear,
  onYearSelect,
  accentColor = 'var(--active-accent)',
}: TimeSeriesChartProps) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [localYear, setLocalYear] = useState<number | null>(null);
  const observations = [...data].sort((a, b) => a.year - b.year);

  if (observations.length === 0) {
    return <p className="inspection-chart__empty">Sin observaciones temporales disponibles.</p>;
  }

  const width = 320;
  const height = 120;
  const plot = { left: 34, right: 310, top: 12, bottom: 72 };
  const minYear = observations[0].year;
  const maxYear = observations[observations.length - 1].year;
  const values = observations.map(point => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const getX = (year: number) => plot.left + ((year - minYear) / (maxYear - minYear || 1)) * (plot.right - plot.left);
  const getY = (value: number) => maxValue === minValue
    ? (plot.top + plot.bottom) / 2
    : plot.bottom - ((value - minValue) / (maxValue - minValue)) * (plot.bottom - plot.top);
  const points = observations.map(point => `${getX(point.year)},${getY(point.value)}`).join(' ');
  const requestedYear = selectedYear ?? localYear ?? maxYear;
  const selectedIndex = observations.reduce((nearest, point, index) =>
    Math.abs(point.year - requestedYear) < Math.abs(observations[nearest].year - requestedYear) ? index : nearest, 0);
  const selectedPoint = observations[selectedIndex];
  const activePoint = observations.find(point => point.year === hoveredYear) ?? selectedPoint;
  const formatValue = (value: number) => value.toLocaleString('es', {
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
                {value.toLocaleString('es', { maximumFractionDigits: 1 })}
              </text>
            </g>
          ))}
          <polyline className="inspection-chart__line" points={points} vectorEffect="non-scaling-stroke" />
          <line className="inspection-chart__cursor" x1={getX(activePoint.year)} y1={plot.top} x2={getX(activePoint.year)} y2={plot.bottom + 5} />
          <circle className="inspection-chart__point" cx={getX(activePoint.year)} cy={getY(activePoint.value)} r="3.5" />
          {observations.map((point, index) => {
            const left = index === 0 ? plot.left : (getX(observations[index - 1].year) + getX(point.year)) / 2;
            const right = index === observations.length - 1 ? plot.right : (getX(point.year) + getX(observations[index + 1].year)) / 2;
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
          {minYear !== maxYear && <text className="inspection-chart__axis" x={plot.right} y="117" textAnchor="end">{maxYear}</text>}
        </svg>
        <input
          className="inspection-chart__range"
          type="range"
          min="0"
          max={Math.max(observations.length - 1, 1)}
          step="1"
          value={selectedIndex}
          disabled={observations.length === 1}
          aria-label="Año de la serie"
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
        <span>Año <strong>{activePoint.year}</strong></span>
        <span><strong>{formatValue(activePoint.value)}</strong> {unit}</span>
      </div>
    </div>
  );
}
