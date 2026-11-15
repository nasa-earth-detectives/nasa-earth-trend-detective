import { useState } from 'react';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationCoverage, ObservationLayerMode, ObservationSource } from '../../types/observationLayer.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import { getObservationValue, observationColorCss, OBSERVATION_SCALES } from '../../utils/colorScales';
import { OCEAN_COVERING_VARIABLES } from '../../config/climateLayers';
import {
  formatCoordinatesPair,
  formatTemplate,
  intlLocale,
  partialYearNoteLocalized,
  provenanceLabelLocalized,
  useI18n,
} from '../../i18n';

interface ObservationReadoutProps {
  observations: ClimateObservation[];
  variable: ClimateVariable;
  year: number;
  source: ObservationSource;
  provenance?: DatasetProvenance | null;
  mode: ObservationLayerMode;
  coverage: ObservationCoverage;
  loading: boolean;
  error: string | null;
  selected: ClimateObservation | null;
  onSelect: (id: string | null) => void;
}

/** Paginated keyboard fallback: never mounts thousands of options. */
function ObservationPicker({ observations, selected, onSelect }: Pick<ObservationReadoutProps, 'observations' | 'selected' | 'onSelect'>) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [requestedPage, setPage] = useState(0);
  const page = Math.min(requestedPage, Math.max(0, Math.ceil(observations.length / 100) - 1));
  const start = page * 100;
  const items = observations.slice(start, start + 100);
  const formatNumber = (value: number) => value.toLocaleString(intlLocale(locale), { maximumFractionDigits: 3 });
  const coords = (item: ClimateObservation) => formatCoordinatesPair(item.latitude, item.longitude, 2, t.readouts.compass);
  const close = (details: HTMLDetailsElement) => { details.open = false; setOpen(false); };
  return <details className="hex-cell-picker" data-ui-control onToggle={event => setOpen(event.currentTarget.open)}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) close(event.currentTarget);
    }}
    onKeyDown={event => {
      if (event.key !== 'Escape' || !event.currentTarget.open) return;
      event.preventDefault(); event.stopPropagation();
      close(event.currentTarget);
      event.currentTarget.querySelector('summary')?.focus();
    }}>
    <summary className="focus-ring">{selected ? t.readouts.pickerOther : t.readouts.pickerChoose}<span aria-hidden="true">↗</span></summary>
    {open && <div className="hex-cell-picker__controls">
      <select className="focus-ring" aria-label={t.readouts.pickerAriaObs} value={selected?.id ?? ''}
        onChange={event => {
          const id = event.target.value || null;
          const details = event.currentTarget.closest<HTMLDetailsElement>('details');
          if (details) {
            close(details);
            if (id === null) details.querySelector('summary')?.focus();
          }
          onSelect(id);
        }}>
        <option value="">{t.readouts.pickerSelect}</option>
        {selected && !items.some(item => item.id === selected.id) && <option value={selected.id}>{coords(selected)}</option>}
        {items.map(item => <option key={item.id} value={item.id}>{coords(item)} · {formatNumber(getObservationValue(item))} {t.scales[item.variable].unit}</option>)}
      </select>
      <div className="hex-cell-picker__pagination">
        <button className="focus-ring" type="button" aria-label={t.readouts.pickerPrev} disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
        <output aria-live="polite">{formatNumber(start + 1)}–{formatNumber(start + items.length)}<span> {t.readouts.pickerOf} {formatNumber(observations.length)}</span></output>
        <button className="focus-ring" type="button" aria-label={t.readouts.pickerNext} disabled={start + items.length >= observations.length} onClick={() => setPage(page + 1)}>→</button>
      </div>
    </div>}
  </details>;
}

/** Annual values, distinct from a temporal slope. Hexagons and heat share a scale. */
export function ObservationReadout({ observations, variable, year, source, provenance = null, mode, coverage, loading, error,
  selected, onSelect }: ObservationReadoutProps) {
  const { locale, t } = useI18n();
  const formatNumber = (value: number) => value.toLocaleString(intlLocale(locale), { maximumFractionDigits: 3 });
  const coords = (item: ClimateObservation) => formatCoordinatesPair(item.latitude, item.longitude, 2, t.readouts.compass);
  const scale = OBSERVATION_SCALES[variable];
  const scaleCopy = t.scales[variable];
  const [min, max] = scale.domain;
  const ready = !loading && !error;
  const cell = ready && selected?.variable === variable
    ? observations.find(item => item.id === selected.id && item.variable === variable) ?? null : null;
  const value = cell ? getObservationValue(cell) : null;
  const ramp = Array.from({ length: 9 }, (_, i) => observationColorCss(variable, min + (max - min) * i / 8)).join(', ');
  const scope = coverage === 'land' || !OCEAN_COVERING_VARIABLES.has(variable) ? t.readouts.scopeLand : t.readouts.scopeGlobal;
  const modeLabel = mode === 'heat' ? t.readouts.modeHeat : mode === 'hex' ? t.readouts.modeHex : t.readouts.modeNone;
  const partialNote = partialYearNoteLocalized(provenance, year, locale);
  return <section className="hex-readout observation-readout" aria-label={t.readouts.observationAria}
    data-state={loading ? 'loading' : error ? 'error' : observations.length ? 'ready' : 'empty'}>
    <div className="hex-readout__heading"><span>{modeLabel} · {scope}</span><span title={partialNote ? t.readouts.partialYearTooltip : undefined}>{year}{partialNote ? ` · ${partialNote}` : ''}</span></div>
    <div className="hex-readout__body" role="status" aria-live="polite" aria-atomic="true">
      {cell && value !== null ? <>
        <p className="hex-readout__coordinates">{coords(cell)}</p>
        <p className="hex-readout__measurement"><strong style={{ color: observationColorCss(variable, value) }} title={formatTemplate(t.readouts.receivedValueTitle, { value })}>{formatNumber(value)}</strong><span>{scaleCopy.unit}</span></p>
        <p className="hex-readout__direction">{scaleCopy.label}</p>
      </> : <div className="hex-readout__count"><strong>{ready ? formatNumber(observations.length) : '—'}</strong>
        <span>{loading ? t.readouts.preparing : error ? t.readouts.noResponse : observations.length ? t.readouts.annualSamples : t.readouts.noObservations}</span></div>}
      {error && <p className="hex-readout__error">{error}</p>}
    </div>
    {ready && observations.length > 0 && mode !== 'none' && <>
      <div className="hex-color-key" role="group" aria-label={`${scaleCopy.label}. ${formatNumber(min)} – ${formatNumber(max)} ${scaleCopy.unit}.`}>
        <p className="hex-color-key__context">{scaleCopy.label}<span>{scaleCopy.unit}</span></p>
        <div className="hex-color-key__ramp" style={{ background: `linear-gradient(90deg, ${ramp})` }} aria-hidden="true">
          {min < 0 && <span className="hex-color-key__zero" />}
          {value !== null && <span className="hex-color-key__selection" style={{ left: `${Math.max(0, Math.min(1, (value - min) / (max - min))) * 100}%` }} />}
        </div>
        <div className="hex-color-key__scale" aria-hidden="true"><span>{formatNumber(min)}</span><span>{formatNumber((min + max) / 2)}</span><span>{formatNumber(max)}</span></div>
        <div className="hex-color-key__labels" aria-hidden="true">{scaleCopy.ramp.map((label, i) => <span key={i}>{label}</span>)}</div>
        {(provenance?.baseline || variable === 'Gistemp') && <p className="hex-color-key__reference">{formatTemplate(t.readouts.relativeBaseline, { baseline: provenance?.baseline ?? t.readouts.baselineFallback })}</p>}
      </div>
      <p className="observation-readout__method">{mode === 'heat' ? t.readouts.methodHeat : t.readouts.methodHex}</p>
    </>}
    <p className="hex-readout__source" title={provenance?.citation}><span aria-hidden="true" />{source === 'demo'
      ? t.readouts.simulatedFooter : provenanceLabelLocalized(provenance, locale)}</p>
    {ready && observations.length > 0 && mode === 'hex' && <ObservationPicker key={variable} observations={observations} selected={cell} onSelect={onSelect} />}
  </section>;
}
