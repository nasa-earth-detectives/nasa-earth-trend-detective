import { useMemo, useState } from 'react';
import { Color } from 'three';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { HEX_PALETTE_GRADIENT, sampleHexColor } from '../../config/hexPalette';
import { describeHexTrend, formatHexValue, HEX_PRESENTATION, readableHexUnit } from '../../config/hexPresentation';
import type { HexCell, HexDataset } from '../../types/hex.types';

interface HexReadoutProps {
  data: HexDataset | null;
  loading: boolean;
  error: string | null;
  selectedCell: HexCell | null;
  onSelectCell: (id: string | null) => void;
}

const number = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 });
const coordinates = (cell: HexCell) =>
  `${Math.abs(cell.latitude).toFixed(1)}° ${cell.latitude < 0 ? 'S' : 'N'} · ${Math.abs(cell.longitude).toFixed(1)}° ${cell.longitude < 0 ? 'O' : 'E'}`;
const PAGE_SIZE = 100;

/** Conserva una selección nativa de teclado sin crear miles de nodos option. */
function CellPicker({ data, cell, onSelectCell }: {
  data: HexDataset;
  cell: HexCell | null;
  onSelectCell: HexReadoutProps['onSelectCell'];
}) {
  const [open, setOpen] = useState(false);
  const [requestedPage, setPage] = useState(0);
  const pageCount = Math.ceil(data.cells.length / PAGE_SIZE);
  const page = Math.min(requestedPage, Math.max(0, pageCount - 1));
  const start = page * PAGE_SIZE;
  const pageCells = data.cells.slice(start, start + PAGE_SIZE);
  const selectedElsewhere = cell && !pageCells.some(item => item.id === cell.id);
  const label = (item: HexCell) => `${coordinates(item)} · ${formatHexValue(item.slope, true)} ${readableHexUnit(data.unit)}`;

  return <details className="hex-cell-picker" data-ui-control
    onKeyDown={event => {
      if (event.key !== 'Escape' || !event.currentTarget.open) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.open = false;
      setOpen(false);
      event.currentTarget.querySelector('summary')?.focus();
    }}
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="focus-ring">{cell ? 'Cambiar celda' : 'Elegir celda'}<span aria-hidden="true">↗</span></summary>
    {open && <div className="hex-cell-picker__controls">
      <select aria-label="Celda de análisis por coordenadas" className="focus-ring"
        value={cell?.id ?? ''} onChange={event => onSelectCell(event.target.value || null)}>
        <option value="">Selecciona una celda</option>
        {selectedElsewhere && <option value={cell.id}>Selección actual · {label(cell)}</option>}
        {pageCells.map(item => <option key={item.id} value={item.id}>{label(item)}</option>)}
      </select>
      <div className="hex-cell-picker__pagination">
        <button className="focus-ring" type="button" aria-label="Página anterior de celdas"
          disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
        <output aria-live="polite">{number.format(start + 1)}–{number.format(start + pageCells.length)}
          <span> de {number.format(data.cells.length)}</span></output>
        <button className="focus-ring" type="button" aria-label="Página siguiente de celdas"
          disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>→</button>
      </div>
    </div>}
  </details>;
}

/** El signo expresa dirección; no determina significancia estadística ni causa física. */
export function HexReadout({ data, loading, error, selectedCell, onSelectCell }: HexReadoutProps) {
  const ready = !loading && !error && data !== null;
  const count = ready ? data.cells.length : 0;
  const state = loading ? 'loading' : error ? 'error' : count === 0 ? 'empty' : 'ready';
  const cell = ready ? selectedCell : null;
  const cellColor = useMemo(() => cell && data
    ? `#${sampleHexColor(cell.slope, data.heightDomain, new Color()).getHexString()}` : undefined,
  [cell, data]);
  const variable = CLIMATE_VARIABLES.find(item => item.id === data?.variable);
  const presentation = data ? HEX_PRESENTATION[data.variable] : null;
  const unit = data ? readableHexUnit(data.unit) : '';
  const clipped = cell && data && Math.abs(cell.slope) > data.heightDomain;
  const direction = cell && presentation
    ? cell.slope < 0 ? presentation.decrease : cell.slope > 0 ? presentation.increase : 'Pendiente cero'
    : null;
  const description = cell && data
    ? describeHexTrend(data.variable, cell.slope, data.unit, data.startYear, data.endYear) : null;
  const selectedPosition = cell && data
    ? `${(Math.max(-1, Math.min(1, cell.slope / data.heightDomain)) + 1) * 50}%` : undefined;

  return (
    <section className="hex-readout" aria-label={presentation?.heading ?? 'Capa de tendencias en hexágonos'} data-state={state}>
      <div className="hex-readout__heading">
        <span title={presentation?.explanation}>{presentation?.heading ?? 'Tendencias de la superficie'}</span>
        {data && <span>{data.startYear}—{data.endYear}</span>}
      </div>
      <div className="hex-readout__body" role="status" aria-live="polite" aria-atomic="true">
        {cell ? <>
          <p className="hex-readout__coordinates">{coordinates(cell)}</p>
          <p className="hex-readout__measurement" title={presentation?.explanation}>
            <span className="sr-only">{description}</span>
            <strong aria-hidden="true" style={{ color: cellColor }} title={`Valor recibido: ${cell.slope} ${data?.unit}`}>{formatHexValue(cell.slope, true)}</strong>
            <span aria-hidden="true">{unit}</span></p>
          <p className="hex-readout__direction" title={presentation?.explanation}>{direction}
            {clipped && <span> · Fuera de escala: color y altura limitados a ±{formatHexValue(data.heightDomain)}</span>}
          </p>
        </> : <div className="hex-readout__count">
          <strong>{loading || error ? '—' : count.toLocaleString('es-CO')}</strong>
          <span>{loading ? 'Preparando la capa…' : error ? 'Capa no disponible' :
            count === 0 ? 'Sin celdas para este periodo' : data?.source === 'demo' ? 'celdas de muestra' : 'celdas de análisis'}</span>
        </div>}
        {error && <p className="hex-readout__error">{error}</p>}
      </div>
      {ready && count > 0 && <>
        <div className="hex-color-key" role="group" aria-label={`Escala de ${variable?.name ?? data.variable}: azul para descensos, rojo para incrementos; cero sin cambio. Dominio fijo de menos ${formatHexValue(data.heightDomain)} a más ${formatHexValue(data.heightDomain)} ${unit}. El color no indica significancia estadística.`}>
          <p className="hex-color-key__context">Ritmo de cambio<span>{unit}</span></p>
          <div className="hex-color-key__ramp" style={{ background: HEX_PALETTE_GRADIENT }} aria-hidden="true">
            <span className="hex-color-key__zero" />
            {cell && <span className="hex-color-key__selection" style={{ left: selectedPosition }} />}
          </div>
          <div className="hex-color-key__scale" aria-hidden="true">
            <span>{formatHexValue(-data.heightDomain, true)}</span><span>0</span><span>{formatHexValue(data.heightDomain, true)}</span>
          </div>
          <div className="hex-color-key__labels" aria-hidden="true">
            <span>Descenso</span><span>Sin cambio</span><span>Incremento</span>
          </div>
        </div>
        <div className="hex-height-key" role="img" aria-label={`Altura proporcional a la magnitud absoluta. Escala fija de cero a ${formatHexValue(data.heightDomain)} ${unit}; valores superiores se limitan visualmente.`}>
          <svg viewBox="0 0 90 44" aria-hidden="true">
            <path className="hex-height-key__datum" d="M0 40H88" />
            {[{ x: 8, y: 31 }, { x: 34, y: 21 }, { x: 60, y: 7 }].map(({ x, y }) =>
              <g key={x}>
                <path className="hex-height-key__side" d={`M${x} ${y + 4}l10 5 10-5v${36 - y}l-10 5-10-5Z`} />
                <path className="hex-height-key__top" d={`M${x} ${y + 4}l10-5 10 5-10 5Z`} />
                <path className="hex-height-key__edge" d={`M${x + 10} ${y + 9}V44`} />
              </g>)}
          </svg>
          <div><span>Altura · magnitud absoluta</span>
            <p>0 <span aria-hidden="true">→</span> {formatHexValue(data.heightDomain)} <span>{unit}</span></p>
          </div>
        </div>
      </>}
      <p className="hex-readout__source">
        <span aria-hidden="true" />
        {!data ? 'Sin datos visibles en esta capa' : data.source === 'api'
          ? 'Datos recibidos de la API' : 'Datos simulados · no son observaciones NASA'}
      </p>
      {ready && count > 0 && <CellPicker key={`${data.variable}:${data.source}`} data={data} cell={cell} onSelectCell={onSelectCell} />}
    </section>
  );
}
