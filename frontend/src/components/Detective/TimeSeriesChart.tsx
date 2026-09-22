/**
 * TimeSeriesChart.tsx
 * Gráfico vectorial interactivo de series temporales en SVG ligero y accesible.
 * Cumple con S2-T5.3 del Sprint 2. Cero dependencias externas pesadas.
 */

import { useState } from 'react';
import type { TimeSeriesDataPoint } from '../../types/detective.types';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  unit: string;
  selectedYear?: number;
  onYearSelect?: (year: number) => void;
  accentColor?: string;
}

export function TimeSeriesChart({
  data,
  unit,
  selectedYear,
  onYearSelect,
  accentColor = '#38bdf8',
}: TimeSeriesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-500 py-6 text-center">Sin observaciones temporales disponibles.</p>;
  }

  const width = 320;
  const height = 120;
  const padding = { top: 12, right: 14, bottom: 22, left: 32 };

  const years = data.map(d => d.year);
  const values = data.map(d => d.value);

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const getX = (year: number) =>
    padding.left + ((year - minYear) / (maxYear - minYear || 1)) * (width - padding.left - padding.right);

  const getY = (val: number) =>
    height - padding.bottom - ((val - minVal) / valRange) * (height - padding.top - padding.bottom);

  const points = data.map(d => `${getX(d.year)},${getY(d.value)}`).join(' ');
  const areaPath = `${points} ${getX(maxYear)},${height - padding.bottom} ${getX(minYear)},${height - padding.bottom}`;

  const activeIndex = hoveredIndex !== null ? hoveredIndex : data.findIndex(d => d.year === selectedYear);
  const activePoint = activeIndex >= 0 ? data[activeIndex] : null;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-28 overflow-visible"
        aria-label="Gráfico de evolución temporal"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Guías horizontales mín/máx */}
        <line x1={padding.left} y1={getY(minVal)} x2={width - padding.right} y2={getY(minVal)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1={padding.left} y1={getY(maxVal)} x2={width - padding.right} y2={getY(maxVal)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* Etiquetas de Ejes */}
        <text x={padding.left - 4} y={getY(maxVal) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
          {maxVal.toFixed(1)}
        </text>
        <text x={padding.left - 4} y={getY(minVal) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
          {minVal.toFixed(1)}
        </text>
        <text x={padding.left} y={height - 6} textAnchor="start" className="text-[9px] fill-slate-500 font-mono">
          {minYear}
        </text>
        <text x={width - padding.right} y={height - 6} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
          {maxYear}
        </text>

        {/* Área sombreada bajo la curva */}
        <polygon points={areaPath} fill="url(#chartGradient)" />

        {/* Línea principal de observaciones */}
        <polyline points={points} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos y disparadores interactivos */}
        {data.map((d, i) => {
          const cx = getX(d.year);
          const cy = getY(d.value);
          const isSelected = d.year === selectedYear;
          return (
            <g key={d.year} className="cursor-pointer" onClick={() => onYearSelect?.(d.year)}>
              <circle
                cx={cx}
                cy={cy}
                r={isSelected ? 4.5 : 2.5}
                fill={isSelected ? '#ffffff' : accentColor}
                stroke={isSelected ? accentColor : 'transparent'}
                strokeWidth={isSelected ? 2 : 0}
                className="transition-all duration-200"
              />
              <rect
                x={cx - 6}
                y={padding.top}
                width={12}
                height={height - padding.top - padding.bottom}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          );
        })}

        {/* Indicador del punto activo */}
        {activePoint && (
          <line
            x1={getX(activePoint.year)}
            y1={padding.top}
            x2={getX(activePoint.year)}
            y2={height - padding.bottom}
            stroke="rgba(255,255,255,0.25)"
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {/* Tooltip de lectura interactiva */}
      {activePoint && (
        <div className="flex justify-between items-center text-[10px] font-mono mt-1 px-1 text-slate-400 bg-slate-900/60 rounded px-2 py-0.5 border border-slate-800">
          <span>Año: <strong className="text-slate-100">{activePoint.year}</strong></span>
          <span>Lectura: <strong className="text-cyan-400">{activePoint.value > 0 ? '+' : ''}{activePoint.value.toFixed(2)} {unit}</strong></span>
        </div>
      )}
    </div>
  );
}
