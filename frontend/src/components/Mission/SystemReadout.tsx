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

/** Distinguishes empty response, failed query, and loading; the count does not imply coverage. */
export function SystemReadout({ connected, observationCount, loading, error, year, variable }: SystemReadoutProps) {
  const state = loading ? 'loading' : error ? 'error' : 'ready';
  return (
    <section className="system-readout" aria-label="Query status" data-state={state}>
      <div className="query-heading"><span>Observation query</span>
        <span className="query-key">{OBSERVATION_LENSES[variable].symbol} / {year}</span></div>
      <div className="readout-values" role="status" aria-live="polite" aria-atomic="true">
        <strong>{loading || error ? '—' : observationCount.toLocaleString('en-US')}</strong>
        <p><span>Records received</span>
          <small>{loading ? 'Querying selected year…' : error ? 'Query failed' :
            observationCount === 0 ? 'Empty response for this query' : 'Response received from API'}</small></p>
      </div>
      <p className="connection-state" data-connected={connected}><span aria-hidden="true" />
        {connected ? 'API available' : 'Local mode · API unavailable'}</p>
    </section>
  );
}
