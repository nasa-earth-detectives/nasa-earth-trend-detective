import { OBSERVATION_LENSES } from '../../config/observationLenses';
import type { ClimateVariable } from '../../types/climate.types';

interface SystemReadoutProps {
  connected: boolean;
  observationCount: number;
  loading: boolean;
  error: string | null;
  year: number;
  variable: ClimateVariable;
}

/** Distingue respuesta vacía, consulta fallida y carga; el contador no implica cobertura. */
export function SystemReadout({ connected, observationCount, loading, error, year, variable }: SystemReadoutProps) {
  const state = loading ? 'loading' : error ? 'error' : 'ready';
  return (
    <section className="system-readout" aria-label="Estado de la consulta" data-state={state}>
      <div className="query-heading"><span>Consulta de observaciones</span>
        <span className="query-key">{OBSERVATION_LENSES[variable].symbol} / {year}</span></div>
      <div className="readout-values" role="status" aria-live="polite" aria-atomic="true">
        <strong>{loading || error ? '—' : observationCount.toLocaleString('es-CO')}</strong>
        <p><span>Registros recibidos</span>
          <small>{loading ? 'Consultando el año seleccionado…' : error ? 'Consulta sin respuesta' :
            observationCount === 0 ? 'Respuesta vacía para esta consulta' : 'Respuesta recibida de la API'}</small></p>
      </div>
      <p className="connection-state" data-connected={connected}><span aria-hidden="true" />
        {connected ? 'API disponible' : 'Modo local · API no disponible'}</p>
    </section>
  );
}
