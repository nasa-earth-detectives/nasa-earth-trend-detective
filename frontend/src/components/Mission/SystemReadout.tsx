import { OBSERVATION_LENSES } from '../../config/observationLenses';
import { intlLocale, useI18n } from '../../i18n';
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
  const { locale, t } = useI18n();
  const state = loading ? 'loading' : error ? 'error' : 'ready';
  return (
    <section className="system-readout" aria-label={t.readouts.queryHeadingAria} data-state={state}>
      <div className="query-heading"><span>{t.readouts.queryHeadingTitle}</span>
        <span className="query-key">{OBSERVATION_LENSES[variable].symbol} / {year}</span></div>
      <div className="readout-values" role="status" aria-live="polite" aria-atomic="true">
        <strong>{loading || error ? '—' : observationCount.toLocaleString(intlLocale(locale))}</strong>
        <p><span>{t.readouts.recordsReceived}</span>
          <small>{loading ? t.readouts.queryingYear : error ? t.readouts.queryFailed :
            observationCount === 0 ? t.readouts.emptyResponse : t.readouts.responseReceived}</small></p>
      </div>
      <p className="connection-state" data-connected={connected}><span aria-hidden="true" />
        {connected ? t.readouts.apiAvailable : t.readouts.localMode}</p>
    </section>
  );
}
