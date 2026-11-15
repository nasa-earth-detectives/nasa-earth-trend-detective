/**
 * Says what the app is waiting for while there is no data to draw. It replaces the simulated scenario
 * that used to appear when the API was slow to answer: a free host can take a minute to wake up, and
 * showing invented values in the meantime passed fiction off as NASA observations.
 */
import { useSyncExternalStore } from 'react';
import { getDataConnection, subscribeDataConnection } from '../../services/datasetCatalog';
import { useI18n } from '../../i18n';

export function DataConnectionNotice() {
  const { t } = useI18n();
  const state = useSyncExternalStore(subscribeDataConnection, getDataConnection);
  if (state === 'idle' || state === 'ready') return null;
  const message = state === 'connecting' ? t.readouts.dataConnecting
    : state === 'loading' ? t.readouts.dataLoading : t.readouts.dataFailed;
  return (
    <p className="data-connection" role="status" aria-live="polite" data-state={state}>
      <span aria-hidden="true" />{message}
    </p>
  );
}
