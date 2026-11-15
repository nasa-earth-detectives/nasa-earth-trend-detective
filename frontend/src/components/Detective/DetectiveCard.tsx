import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationSource } from '../../types/observationLayer.types';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import { useCellTrend } from '../../hooks/useCellTrend';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { formatCoordinate } from '../../utils/detectiveAnalysis';
import { TrendSignificanceBadge } from './TrendSignificanceBadge';
import { TimeSeriesChart } from './TimeSeriesChart';
import { TrendMethods } from './TrendMethods';
import { DetectiveExportActions } from './DetectiveExportActions';
import { sampleDemoObservation } from '../../services/demo/observationDemoData';
import { getObservationValue, OBSERVATION_SCALES } from '../../utils/colorScales';
import {
  formatTemplate,
  getRegionalBiomeLocalized,
  intlLocale,
  localizeUnit,
  provenanceLabelLocalized,
  useI18n,
} from '../../i18n';
import '../../styles/inspection.css';

interface DetectiveCardProps {
  open: boolean;
  location: SelectedLocation | null;
  variable: ClimateVariable;
  year: number;
  source: ObservationSource;
  provenance?: DatasetProvenance | null;
  observation: ClimateObservation | null;
  observationDistanceDegrees: number | null;
  supportRadiusDegrees: number;
  loading: boolean;
  onClose: () => void;
  onYearChange?: (year: number) => void;
}

/** With API: real annual cell series and its Mann-Kendall / Sen verdict. With demo: labeled scenario. */
export function DetectiveCard({ open, location, variable, year, source, provenance = null, observation,
  observationDistanceDegrees, supportRadiusDegrees, loading, onClose, onYearChange }: DetectiveCardProps) {
  const { locale, t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable);
  const trend = useCellTrend(variable, open && source === 'api' ? provenance : null, observation);
  const unit = localizeUnit(provenance?.trendUnit ?? `${OBSERVATION_SCALES[variable].unit} / year`, locale);
  const biomeInfo = location ? getRegionalBiomeLocalized(location.lat, location.lng, locale) : null;
  const compass = t.readouts.compass;
  const variableName = t.variables[variable]?.name ?? metadata?.name ?? variable;
  const scaleCopy = t.scales[variable];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const seriesData = useMemo<TimeSeriesDataPoint[]>(() => {
    if (!observation || loading) return [];
    // Without the backend series, do not fabricate a regional one: only the received annual value.
    if (source === 'api') return trend.data?.series ?? [{ year, value: getObservationValue(observation) }];
    return Array.from({ length: SATELLITE_TIMELINE.endYear - SATELLITE_TIMELINE.startYear + 1 }, (_, index) => {
      const sampleYear = SATELLITE_TIMELINE.startYear + index;
      return { year: sampleYear, value: getObservationValue(sampleDemoObservation(variable, sampleYear,
        observation.latitude, observation.longitude)) };
    });
  }, [variable, source, observation, year, loading, trend.data]);
  const seriesYears = trend.data?.series.length
    ? `${trend.data.series[0].year}—${trend.data.series[trend.data.series.length - 1].year}` : String(year);

  if (!open || !location) return null;
  const nearby = observation !== null && (observationDistanceDegrees ?? 0) > 1e-7;
  const tag = intlLocale(locale);
  const nearestDistance = observationDistanceDegrees?.toLocaleString(tag, { maximumFractionDigits: 2 }) ?? '—';

  return (
    <aside id="tour-detective-card" className="inspection-instrument scrollbar-instrument"
      aria-labelledby="inspection-title" data-ui-control>
      <header className="inspection-header">
        <div>
          <p>{observation && !nearby ? t.inspection.cellCenter : t.inspection.selectedLocation}</p>
          <h2 id="inspection-title">{t.inspection.title}</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspection-close focus-ring"
          aria-label={t.inspection.closeAria}>
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <dl className="inspection-coordinates">
        <div><dt>{t.inspection.latitude}</dt><dd title={String(location.lat)}>{formatCoordinate(location.lat, compass.north, compass.south)}</dd></div>
        <div><dt>{t.inspection.longitude}</dt><dd title={String(location.lng)}>{formatCoordinate(location.lng, compass.east, compass.west)}</dd></div>
      </dl>

      {biomeInfo && (
        <div className="inspection-biome">
          <p className="inspection-biome-title">{biomeInfo.biome}</p>
          <p className="inspection-biome-note">{biomeInfo.contextNote}</p>
        </div>
      )}

      {nearby && observation && <div className="inspection-provenance">
        <p>{formatTemplate(t.inspection.nearestSample, { distance: nearestDistance })}</p>
        <p title={`${observation.latitude}, ${observation.longitude}`}>
          {formatCoordinate(observation.latitude, compass.north, compass.south)} · {formatCoordinate(observation.longitude, compass.east, compass.west)}
        </p>
        <p>{t.inspection.nearestSampleDisclaimer}</p>
      </div>}

      <div className="inspection-variable">
        <p>{variableName}</p>
        <p><span>{t.inspection.referenceProduct}</span><strong>{metadata?.satelliteMission}</strong></p>
      </div>

      <div className="inspection-series-heading">
        <h3>{loading ? t.inspection.queryingObservations : !observation ? t.inspection.noNearbySample : source === 'demo' ? t.inspection.simulatedSeries
          : trend.data ? t.inspection.observedSeries : t.inspection.availableObservation}</h3>
        <span>{observation && source === 'demo' ? `${SATELLITE_TIMELINE.startYear}—${SATELLITE_TIMELINE.endYear}` : seriesYears}</span>
      </div>
      {loading ? <p className="inspection-chart__empty">{t.inspection.queryingSelectedYear}</p> :
        <TimeSeriesChart data={seriesData} unit={scaleCopy.unit}
          selectedYear={year} onYearSelect={onYearChange}
          senSlope={source === 'demo' || !observation || !trend.data ? undefined : trend.data.sensSlope} />}

      <DetectiveExportActions
        seriesData={seriesData}
        variable={variable}
        location={location}
        year={year}
        unit={OBSERVATION_SCALES[variable].unit}
        isObserved={source === 'api' && !!observation}
      />

      <footer className="inspection-provenance">
        {!loading && !observation && <p>{formatTemplate(t.inspection.noSamplesWithinRadius, { radius: supportRadiusDegrees })}</p>}
        <p>{source === 'demo' ? t.inspection.syntheticFooter :
          observation ? provenanceLabelLocalized(provenance, locale) : t.inspection.noSampleForLocation}</p>
        <p>{variable === 'Gistemp'
          ? t.inspection.gistempScaleNote
          : `${scaleCopy.label}.`}</p>
        <p>{t.inspection.mannKendallLabel} {trend.data && (
          <TrendSignificanceBadge result={{
            isSignificant: trend.data.isSignificant,
            pValue: trend.data.pValue,
            sensSlope: trend.data.sensSlope,
            zScore: trend.data.zScore,
            survivesPersistence: trend.data.prewhitened?.isSignificant,
          }} variable={variable} unit={unit} />
        )} <span>{source === 'demo' || !observation ? t.inspection.notCalculated : trend.loading ? t.inspection.calculating
          : trend.error ? t.inspection.unavailable : trend.data ? `${trend.data.sensSlope >= 0 ? '+' : ''}${trend.data.sensSlope.toLocaleString(tag,
            { maximumFractionDigits: 3 })} ${unit} · p = ${trend.data.pValue.toLocaleString(tag, { maximumSignificantDigits: 2 })}${
            trend.data.isSignificant ? ` · ${t.inspection.significant}` : ` · ${t.inspection.notSignificant}`}` : t.inspection.notCalculated}</span></p>
        {source === 'api' && observation && trend.data && <TrendMethods trend={trend.data} unit={unit} />}
      </footer>
    </aside>
  );
}
