import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { DatasetCatalog, DatasetProvenance } from '../../types/dataset.types';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { getDatasetCatalog } from '../../services/datasetCatalog';
import { placeLabel, type Place } from '../../services/placeSearch';
import { useCellTrend } from '../../hooks/useCellTrend';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { trendOutlook } from '../../utils/trendProjection';
import { formatBox } from '../../utils/regionFormat';
import { TimeSeriesChart } from '../Detective/TimeSeriesChart';
import { TrendProjection } from '../Detective/TrendProjection';
import { formatTemplate, intlLocale, localizeUnit, provenanceLabelLocalized, useI18n } from '../../i18n';
import '../../styles/detective-modals.css';
import '../../styles/place-search.css';

interface PlaceSeriesProps {
  place: Place;
  variable: ClimateVariable;
  /** Null until the API has said which years the variable covers. */
  provenance: DatasetProvenance | null;
  onRetry: () => void;
}

/**
 * The annual series of one variable at the place, the verdict on its trend and where that trend would
 * take it. A request that fails is not the same as a place without data: it says so and can be repeated.
 */
function PlaceSeries({ place, variable, provenance, onRetry }: PlaceSeriesProps) {
  const { locale, t } = useI18n();
  const centre = place.box ?? place;
  const target = useMemo(() => ({ latitude: centre.lat, longitude: centre.lng }), [centre.lat, centre.lng]);
  const trend = useCellTrend(variable, provenance, target, { latRadius: place.box?.latRadius, lngRadius: place.box?.lngRadius });
  const outlook = useMemo(() => (trend.data ? trendOutlook(trend.data.series, trend.data.sensSlope) : null), [trend.data]);
  const scale = t.scales[variable];
  const tag = intlLocale(locale);

  if (!provenance || trend.loading) return <p className="inspection-chart__empty">{t.inspection.calculating}</p>;
  if (trend.error || !trend.data || !outlook) {
    return (
      <div className="place-forecast__failed">
        <p className="inspection-chart__empty">{t.places.failed}</p>
        <button type="button" className="place-forecast__open focus-ring" onClick={onRetry}>{t.places.retry}</button>
      </div>
    );
  }
  const { series, sensSlope, pValue, isSignificant } = trend.data;
  if (series.length === 0) return <p className="inspection-chart__empty">{t.places.noData}</p>;
  return (
    // The chart keeps the width it was drawn for: stretched across the dialog its figures deform.
    <div className="place-forecast__columns">
      <div>
        <div className="place-forecast__heading">
          <h3>{scale.label}</h3>
          <span>{series[0].year}—{series[series.length - 1].year}</span>
        </div>
        <TimeSeriesChart data={series} unit={scale.unit} senSlope={sensSlope} projection={outlook.path} />
        <p className="place-forecast__verdict">
          {sensSlope >= 0 ? '+' : ''}{sensSlope.toLocaleString(tag, { maximumFractionDigits: 3 })}
          {' '}{localizeUnit(provenance.trendUnit, locale)}
          {' · p = '}{pValue.toLocaleString(tag, { maximumSignificantDigits: 2 })}
          {' · '}{isSignificant ? t.inspection.significant : t.inspection.notSignificant}
        </p>
      </div>
      <TrendProjection projection={outlook.listed} unit={scale.unit} significant={isSignificant} />
    </div>
  );
}

interface PlaceForecastProps {
  place: Place;
  initialVariable: ClimateVariable;
  onClose: () => void;
  /** Carries the place, with the variable being read, to the complete analysis. */
  onOpenDossier: (variable: ClimateVariable) => void;
}

/**
 * Outlook of a place found by name: its annual series from the API, the trend of that series and
 * where the trend would take it in the coming years. A city is analysed as a point (the 2° around
 * it); a department or a country, as the box of its extent.
 */
export function PlaceForecast({ place, initialVariable, onClose, onOpenDossier }: PlaceForecastProps) {
  const { locale, t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [variable, setVariable] = useState<ClimateVariable>(initialVariable);
  const [attempt, setAttempt] = useState(0);
  const [catalog, setCatalog] = useState<DatasetCatalog | null>(null);
  useFocusTrap(dialogRef);

  useEffect(() => {
    let active = true;
    // As in the briefing: a free host may still be waking up, so the catalog is asked for until it is
    // complete. Once it is, the service answers from memory with the same object and nothing re-renders.
    const load = () => void getDatasetCatalog().then(loaded => { if (active) setCatalog(loaded); });
    load();
    const timer = window.setInterval(load, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const provenance = catalog?.get(variable) ?? null;
  const variables = CLIMATE_VARIABLES.filter(meta => catalog?.has(meta.id));

  return (
    <div className="dossier-backdrop" onClick={onClose}>
      <div className="dossier place-forecast" role="dialog" aria-modal="true" aria-labelledby="place-forecast-title"
        ref={dialogRef} tabIndex={-1} onClick={event => event.stopPropagation()}>
        <header className="dossier__header">
          <div>
            <p className="dossier__eyebrow">{t.places.eyebrow}<span>{t.places.kinds[place.kind]}{place.country ? ` · ${place.country}` : ''}</span></p>
            <h2 id="place-forecast-title">{placeLabel(place)}</h2>
            <p className="dossier__lead">{place.box
              ? formatTemplate(t.places.areaBox, { box: formatBox(place.box, t.readouts.compass) }) : t.places.areaPoint}</p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label={t.modals.closeAria}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="place-forecast__body scrollbar-instrument">
          <div role="radiogroup" aria-label={t.places.variableAria} className="place-forecast__variables">
            {variables.map(meta => (
              <button key={meta.id} type="button" role="radio" aria-checked={meta.id === variable}
                className="place-forecast__variable focus-ring" onClick={() => setVariable(meta.id)}>
                {t.variables[meta.id]?.name ?? meta.name}
              </button>
            ))}
          </div>
          {/* Remounted for each variable and each retry, so a failed request is asked again from scratch. */}
          <PlaceSeries key={`${variable}:${attempt}`} place={place} variable={variable} provenance={provenance}
            onRetry={() => setAttempt(count => count + 1)} />
        </div>

        <footer className="dossier__foot place-forecast__foot">
          <span>{provenanceLabelLocalized(provenance, locale)}</span>
          <button type="button" className="place-forecast__open focus-ring" onClick={() => onOpenDossier(variable)}>
            {t.places.openDossier}
          </button>
        </footer>
      </div>
    </div>
  );
}
