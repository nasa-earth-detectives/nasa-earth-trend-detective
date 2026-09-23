import { useState } from 'react';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationCoverage, ObservationLayerMode, ObservationSource } from '../../types/observationLayer.types';
import { getObservationValue, observationColorCss, OBSERVATION_SCALES } from '../../utils/colorScales';

interface ObservationReadoutProps {
  observations: ClimateObservation[];
  variable: ClimateVariable;
  year: number;
  source: ObservationSource;
  mode: ObservationLayerMode;
  coverage: ObservationCoverage;
  loading: boolean;
  error: string | null;
  selected: ClimateObservation | null;
  onSelect: (id: string | null) => void;
}
const number = (value: number) => value.toLocaleString('es-CO', { maximumFractionDigits: 3 });
const coordinates = (item: ClimateObservation) => `${Math.abs(item.latitude).toFixed(2)}° ${item.latitude < 0 ? 'S' : 'N'} · ${Math.abs(item.longitude).toFixed(2)}° ${item.longitude < 0 ? 'O' : 'E'}`;
const descriptions: Record<ClimateVariable, [string, string, string]> = {
  Gistemp: ['Más fría', 'Referencia', 'Más cálida'],
  ModisNdvi: ['Bajo NDVI', '', 'Alto NDVI'],
  GraceMass: ['Déficit', 'Referencia', 'Acumulación'],
  Oco2: ['Menor CO₂', '', 'Mayor CO₂'],
};

/** Alternativa de teclado paginada: nunca monta miles de opciones. */
function ObservationPicker({ observations, selected, onSelect }: Pick<ObservationReadoutProps, 'observations' | 'selected' | 'onSelect'>) {
  const [open, setOpen] = useState(false);
  const [requestedPage, setPage] = useState(0);
  const page = Math.min(requestedPage, Math.max(0, Math.ceil(observations.length / 100) - 1));
  const start = page * 100;
  const items = observations.slice(start, start + 100);
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
    <summary className="focus-ring">{selected ? 'Otra celda' : 'Elegir celda'}<span aria-hidden="true">↗</span></summary>
    {open && <div className="hex-cell-picker__controls">
      <select className="focus-ring" aria-label="Celda de observación por coordenadas" value={selected?.id ?? ''}
        onChange={event => {
          const id = event.target.value || null;
          const details = event.currentTarget.closest<HTMLDetailsElement>('details');
          if (details) {
            close(details);
            if (id === null) details.querySelector('summary')?.focus();
          }
          onSelect(id);
        }}>
        <option value="">Selecciona una celda</option>
        {selected && !items.some(item => item.id === selected.id) && <option value={selected.id}>{coordinates(selected)}</option>}
        {items.map(item => <option key={item.id} value={item.id}>{coordinates(item)} · {number(getObservationValue(item))} {OBSERVATION_SCALES[item.variable].unit}</option>)}
      </select>
      <div className="hex-cell-picker__pagination">
        <button className="focus-ring" type="button" aria-label="Página anterior de celdas" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
        <output aria-live="polite">{number(start + 1)}–{number(start + items.length)}<span> de {number(observations.length)}</span></output>
        <button className="focus-ring" type="button" aria-label="Página siguiente de celdas" disabled={start + items.length >= observations.length} onClick={() => setPage(page + 1)}>→</button>
      </div>
    </div>}
  </details>;
}

/** Valores anuales, distintos de una pendiente temporal. Hexágonos y calor comparten escala. */
export function ObservationReadout({ observations, variable, year, source, mode, coverage, loading, error, selected, onSelect }: ObservationReadoutProps) {
  const scale = OBSERVATION_SCALES[variable];
  const [min, max] = scale.domain;
  const ready = !loading && !error;
  const cell = ready && selected?.variable === variable
    ? observations.find(item => item.id === selected.id && item.variable === variable) ?? null : null;
  const value = cell ? getObservationValue(cell) : null;
  const ramp = Array.from({ length: 9 }, (_, i) => observationColorCss(variable, min + (max - min) * i / 8)).join(', ');
  const labels = descriptions[variable];
  const scope = source === 'api' ? 'Cobertura recibida' : coverage === 'land' || variable === 'ModisNdvi' || variable === 'GraceMass' ? 'Superficie terrestre' : 'Tierra + océano';
  return <section className="hex-readout observation-readout" aria-label="Lectura de observaciones"
    data-state={loading ? 'loading' : error ? 'error' : observations.length ? 'ready' : 'empty'}>
    <div className="hex-readout__heading"><span>{mode === 'heat' ? 'Mapa de calor' : mode === 'hex' ? 'Hexágonos 3D' : 'Observaciones'} · {scope}</span><span>{year}</span></div>
    <div className="hex-readout__body" role="status" aria-live="polite" aria-atomic="true">
      {cell && value !== null ? <>
        <p className="hex-readout__coordinates">{coordinates(cell)}</p>
        <p className="hex-readout__measurement"><strong style={{ color: observationColorCss(variable, value) }} title={`Valor recibido: ${value}`}>{number(value)}</strong><span>{scale.unit}</span></p>
        <p className="hex-readout__direction">{scale.label}</p>
      </> : <div className="hex-readout__count"><strong>{ready ? number(observations.length) : '—'}</strong>
        <span>{loading ? 'Preparando…' : error ? 'Sin respuesta' : observations.length ? 'muestras anuales' : 'Sin observaciones'}</span></div>}
      {error && <p className="hex-readout__error">{error}</p>}
    </div>
    {ready && observations.length > 0 && mode !== 'none' && <>
      <div className="hex-color-key" role="group" aria-label={`${scale.label}. Escala fija de ${number(min)} a ${number(max)} ${scale.unit}.`}>
        <p className="hex-color-key__context">{scale.label}<span>{scale.unit}</span></p>
        <div className="hex-color-key__ramp" style={{ background: `linear-gradient(90deg, ${ramp})` }} aria-hidden="true">
          {min < 0 && <span className="hex-color-key__zero" />}
          {value !== null && <span className="hex-color-key__selection" style={{ left: `${Math.max(0, Math.min(1, (value - min) / (max - min))) * 100}%` }} />}
        </div>
        <div className="hex-color-key__scale" aria-hidden="true"><span>{number(min)}</span><span>{number((min + max) / 2)}</span><span>{number(max)}</span></div>
        <div className="hex-color-key__labels" aria-hidden="true">{labels.map((label, i) => <span key={i}>{label}</span>)}</div>
        {variable === 'Gistemp' && <p className="hex-color-key__reference">Respecto al promedio de referencia</p>}
      </div>
      <p className="observation-readout__method">{mode === 'heat' ? 'Media espacial suavizada · radio de 4°' : 'Altura normalizada · escala fija por variable'}</p>
    </>}
    <p className="hex-readout__source"><span aria-hidden="true" />{source === 'demo' ? 'Datos simulados · no son observaciones NASA' : 'Observaciones recibidas de la API'}</p>
    {ready && observations.length > 0 && mode === 'hex' && <ObservationPicker key={variable} observations={observations} selected={cell} onSelect={onSelect} />}
  </section>;
}
