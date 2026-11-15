import { useMemo, useState } from 'react';
import { Color } from 'three';
import { HEX_PALETTE_GRADIENT, sampleHexColor } from '../../config/hexPalette';
import type { HexCell, HexDataset } from '../../types/hex.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import {
  describeHexTrendLocalized,
  formatCoordinatesPair,
  formatHexValueLocalized,
  formatTemplate,
  intlLocale,
  provenanceLabelLocalized,
  readableHexUnitLocalized,
  useI18n,
} from '../../i18n';
import { HexCellVerdict, HexSignificanceSummary } from './HexSignificance';

interface HexReadoutProps {
  data: HexDataset | null;
  /** Active variable provenance: labels the real source instead of a generic "API". */
  provenance?: DatasetProvenance | null;
  loading: boolean;
  error: string | null;
  selectedCell: HexCell | null;
  onSelectCell: (id: string | null) => void;
}

const PAGE_SIZE = 100;

/** Keeps a native keyboard selection without creating thousands of option nodes. */
function CellPicker({ data, cell, onSelectCell }: {
  data: HexDataset;
  cell: HexCell | null;
  onSelectCell: HexReadoutProps['onSelectCell'];
}) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [requestedPage, setPage] = useState(0);
  const number = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 4 });
  const coordinates = (item: HexCell) => formatCoordinatesPair(item.latitude, item.longitude, 1, t.readouts.compass);
  const pageCount = Math.ceil(data.cells.length / PAGE_SIZE);
  const page = Math.min(requestedPage, Math.max(0, pageCount - 1));
  const start = page * PAGE_SIZE;
  const pageCells = data.cells.slice(start, start + PAGE_SIZE);
  const selectedElsewhere = cell && !pageCells.some(item => item.id === cell.id);
  const label = (item: HexCell) =>
    `${coordinates(item)} · ${formatHexValueLocalized(item.slope, locale, true)} ${readableHexUnitLocalized(data.unit, locale)}`;

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
    <summary className="focus-ring">{cell ? t.readouts.pickerChange : t.readouts.pickerChoose}<span aria-hidden="true">↗</span></summary>
    {open && <div className="hex-cell-picker__controls">
      <select aria-label={t.readouts.pickerAriaTrend} className="focus-ring"
        value={cell?.id ?? ''} onChange={event => onSelectCell(event.target.value || null)}>
        <option value="">{t.readouts.pickerSelect}</option>
        {selectedElsewhere && <option value={cell.id}>{t.readouts.pickerCurrentSel} · {label(cell)}</option>}
        {pageCells.map(item => <option key={item.id} value={item.id}>{label(item)}</option>)}
      </select>
      <div className="hex-cell-picker__pagination">
        <button className="focus-ring" type="button" aria-label={t.readouts.pickerPrev}
          disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
        <output aria-live="polite">{number.format(start + 1)}–{number.format(start + pageCells.length)}
          <span> {t.readouts.pickerOf} {number.format(data.cells.length)}</span></output>
        <button className="focus-ring" type="button" aria-label={t.readouts.pickerNext}
          disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>→</button>
      </div>
    </div>}
  </details>;
}

/** The sign expresses direction; it does not determine statistical significance or physical cause. */
export function HexReadout({ data, provenance = null, loading, error, selectedCell, onSelectCell }: HexReadoutProps) {
  const { locale, t } = useI18n();
  const ready = !loading && !error && data !== null;
  const count = ready ? data.cells.length : 0;
  const state = loading ? 'loading' : error ? 'error' : count === 0 ? 'empty' : 'ready';
  const cell = ready ? selectedCell : null;
  const cellColor = useMemo(() => cell && data
    ? `#${sampleHexColor(cell.slope, data.heightDomain, new Color()).getHexString()}` : undefined,
  [cell, data]);
  const coordinates = (item: HexCell) => formatCoordinatesPair(item.latitude, item.longitude, 1, t.readouts.compass);
  const variableName = data ? (t.variables[data.variable]?.name ?? data.variable) : '';
  const presentation = data ? t.hexPresentation[data.variable] : null;
  const unit = data ? readableHexUnitLocalized(data.unit, locale) : '';
  const clipped = cell && data && Math.abs(cell.slope) > data.heightDomain;
  const direction = cell && presentation
    ? cell.slope < 0 ? presentation.decrease : cell.slope > 0 ? presentation.increase : t.readouts.zeroSlope
    : null;
  const description = cell && data
    ? describeHexTrendLocalized(data.variable, cell.slope, data.unit, data.startYear, data.endYear, locale) : null;
  const selectedPosition = cell && data
    ? `${(Math.max(-1, Math.min(1, cell.slope / data.heightDomain)) + 1) * 50}%` : undefined;

  return (
    <section className="hex-readout" aria-label={presentation?.heading ?? t.readouts.defaultHeading} data-state={state}>
      <div className="hex-readout__heading">
        <span title={presentation?.explanation}>{presentation?.heading ?? t.readouts.surfaceTrends}</span>
        {data && <span>{data.startYear}—{data.endYear}</span>}
      </div>
      <div className="hex-readout__body" role="status" aria-live="polite" aria-atomic="true">
        {cell ? <>
          <p className="hex-readout__coordinates">{coordinates(cell)}</p>
          <p className="hex-readout__measurement" title={presentation?.explanation}>
            <span className="sr-only">{description}</span>
            <strong aria-hidden="true" style={{ color: cellColor }} title={formatTemplate(t.readouts.receivedValueTitle, { value: `${cell.slope} ${data?.unit}` })}>{formatHexValueLocalized(cell.slope, locale, true)}</strong>
            <span aria-hidden="true">{unit}</span></p>
          <p className="hex-readout__direction" title={presentation?.explanation}>{direction}
            {clipped && <span> · {formatTemplate(t.readouts.outOfScale, { domain: formatHexValueLocalized(data.heightDomain, locale) })}</span>}
          </p>
          <HexCellVerdict cell={cell} />
        </> : <div className="hex-readout__count">
          <strong>{loading || error ? '—' : count.toLocaleString(intlLocale(locale))}</strong>
          <span>{loading ? t.readouts.preparingLayer : error ? t.readouts.layerUnavailable :
            count === 0 ? t.readouts.noCellsPeriod : data?.source === 'demo' ? t.readouts.sampleCells : t.readouts.analysisCells}</span>
        </div>}
        {!cell && ready && data.significance && <HexSignificanceSummary significance={data.significance} />}
        {error && <p className="hex-readout__error">{error}</p>}
      </div>
      {ready && count > 0 && <>
        <div className="hex-color-key" role="group" aria-label={`${variableName} · ${t.readouts.rateOfChange}: ${formatHexValueLocalized(-data.heightDomain, locale, true)} – ${formatHexValueLocalized(data.heightDomain, locale, true)} ${unit}`}>
          <p className="hex-color-key__context">{t.readouts.rateOfChange}<span>{unit}</span></p>
          <div className="hex-color-key__ramp" style={{ background: HEX_PALETTE_GRADIENT }} aria-hidden="true">
            <span className="hex-color-key__zero" />
            {cell && <span className="hex-color-key__selection" style={{ left: selectedPosition }} />}
          </div>
          <div className="hex-color-key__scale" aria-hidden="true">
            <span>{formatHexValueLocalized(-data.heightDomain, locale, true)}</span><span>0</span><span>{formatHexValueLocalized(data.heightDomain, locale, true)}</span>
          </div>
          <div className="hex-color-key__labels" aria-hidden="true">
            <span>{t.readouts.decrease}</span><span>{t.readouts.noChange}</span><span>{t.readouts.increase}</span>
          </div>
        </div>
        <div className="hex-height-key" role="img" aria-label={`${t.readouts.heightMagnitude}: 0 → ${formatHexValueLocalized(data.heightDomain, locale)} ${unit}`}>
          <svg viewBox="0 0 90 44" aria-hidden="true">
            <path className="hex-height-key__datum" d="M0 40H88" />
            {[{ x: 8, y: 31 }, { x: 34, y: 21 }, { x: 60, y: 7 }].map(({ x, y }) =>
              <g key={x}>
                <path className="hex-height-key__side" d={`M${x} ${y + 4}l10 5 10-5v${36 - y}l-10 5-10-5Z`} />
                <path className="hex-height-key__top" d={`M${x} ${y + 4}l10-5 10 5-10 5Z`} />
                <path className="hex-height-key__edge" d={`M${x + 10} ${y + 9}V44`} />
              </g>)}
          </svg>
          <div><span>{t.readouts.heightMagnitude}</span>
            <p>0 <span aria-hidden="true">→</span> {formatHexValueLocalized(data.heightDomain, locale)} <span>{unit}</span></p>
          </div>
        </div>
      </>}
      <p className="hex-readout__source">
        <span aria-hidden="true" />
        {!data ? t.readouts.noVisibleData : data.source === 'api'
          ? provenanceLabelLocalized(provenance, locale) : t.readouts.simulatedFooter}
      </p>
      {ready && count > 0 && <CellPicker key={`${data.variable}:${data.source}`} data={data} cell={cell} onSelectCell={onSelectCell} />}
    </section>
  );
}
