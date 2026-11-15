import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationSource } from '../../types/observationLayer.types';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import { useCellTrend } from '../../hooks/useCellTrend';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { WIZARD_REGIONS, isWholeRegion, regionContaining } from '../../config/wizardOptions';
import { formatBox } from '../../utils/regionFormat';
import { formatCoordinate } from '../../utils/detectiveAnalysis';
import { TrendSignificanceBadge } from './TrendSignificanceBadge';
import { TimeSeriesChart } from './TimeSeriesChart';
import { TrendMethods } from './TrendMethods';
import { TrendProjection } from './TrendProjection';
import { trendOutlook } from '../../utils/trendProjection';
import { DetectiveExportActions } from './DetectiveExportActions';
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
  /** Years asked for in the briefing; null analyses the whole record. */
  period?: { startYear: number; endYear: number } | null;
  onClose: () => void;
  onYearChange?: (year: number) => void;
}

/** Real annual series of the cell and its Mann-Kendall / Sen verdict, as returned by the API. */
export function DetectiveCard({ open, location, variable, year, provenance = null, observation,
  observationDistanceDegrees, supportRadiusDegrees, loading, period = null, onClose, onYearChange }: DetectiveCardProps) {
  const { locale, t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable);
  // A whole region is analysed from its box, whether or not a sample sits near its centre; a point is
  // analysed from the nearest sample, as before.
  const wholeRegion = location !== null && isWholeRegion(location);
  const target = useMemo(() => (wholeRegion && location ? { latitude: location.lat, longitude: location.lng } : observation),
    [wholeRegion, location, observation]);
  const trend = useCellTrend(variable, open ? provenance : null, target, {
    latRadius: wholeRegion ? location?.latRadius : undefined, lngRadius: wholeRegion ? location?.lngRadius : undefined,
    startYear: period?.startYear, endYear: period?.endYear });
  const analysable = wholeRegion || observation !== null;
  const unit = localizeUnit(provenance?.trendUnit ?? `${OBSERVATION_SCALES[variable].unit} / year`, locale);
  const biomeInfo = location && !wholeRegion ? getRegionalBiomeLocalized(location.lat, location.lng, locale) : null;
  const region = location ? WIZARD_REGIONS.find(item => item.id === location.regionId) ?? regionContaining(location.lat, location.lng) : null;
  const regionName = location?.placeName ?? (region ? t.regions[region.id]?.label ?? region.label : null);
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
    if (!analysable || loading) return [];
    // Without the backend series, do not fabricate a regional one: only the received annual value.
    return trend.data?.series ?? (observation && !wholeRegion ? [{ year, value: getObservationValue(observation) }] : []);
  }, [analysable, wholeRegion, observation, year, loading, trend.data]);
  const outlook = useMemo(() => (trend.data ? trendOutlook(trend.data.series, trend.data.sensSlope) : null), [trend.data]);
  const seriesYears = trend.data?.series.length
    ? `${trend.data.series[0].year}—${trend.data.series[trend.data.series.length - 1].year}` : String(year);

  if (!open || !location) return null;
  const nearby = !wholeRegion && observation !== null && (observationDistanceDegrees ?? 0) > 1e-7;
  const tag = intlLocale(locale);
  const nearestDistance = observationDistanceDegrees?.toLocaleString(tag, { maximumFractionDigits: 2 }) ?? '—';

  return (
    <aside id="tour-detective-card" className="inspection-instrument scrollbar-instrument"
      aria-labelledby="inspection-title" data-ui-control>
      <header className="inspection-header">
        <div>
          <p>{wholeRegion ? t.inspection.wholeRegion : observation && !nearby ? t.inspection.cellCenter : t.inspection.selectedLocation}</p>
          <h2 id="inspection-title">{t.inspection.title}</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspection-close focus-ring"
          aria-label={t.inspection.closeAria}>
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <dl className="inspection-coordinates">
        <div className="inspection-coordinates__wide"><dt>{t.inspection.regionLabel}</dt>
          <dd>{regionName ?? t.inspection.outsideRegions}</dd></div>
        <div className="inspection-coordinates__wide"><dt>{t.inspection.areaLabel}</dt>
          <dd className="inspection-coordinates__text">{wholeRegion
            ? formatTemplate(t.inspection.areaWhole, { box: formatBox({ lat: location.lat, lng: location.lng,
              latRadius: location.latRadius ?? 0, lngRadius: location.lngRadius ?? 0 }, compass) })
            : t.inspection.areaPoint}</dd></div>
        <div><dt>{wholeRegion ? t.inspection.centerLatitude : t.inspection.latitude}</dt><dd title={String(location.lat)}>{formatCoordinate(location.lat, compass.north, compass.south)}</dd></div>
        <div><dt>{wholeRegion ? t.inspection.centerLongitude : t.inspection.longitude}</dt><dd title={String(location.lng)}>{formatCoordinate(location.lng, compass.east, compass.west)}</dd></div>
      </dl>

      <p className="inspection-area-note">{wholeRegion ? t.inspection.explainRegion : t.inspection.explainPoint}</p>

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
        <h3>{loading ? t.inspection.queryingObservations : !analysable ? t.inspection.noNearbySample
          : trend.data ? t.inspection.observedSeries : t.inspection.availableObservation}</h3>
        <span>{seriesYears}</span>
      </div>
      {loading ? <p className="inspection-chart__empty">{t.inspection.queryingSelectedYear}</p> :
        <TimeSeriesChart data={seriesData} unit={scaleCopy.unit}
          selectedYear={year} onYearSelect={onYearChange}
          senSlope={!analysable || !trend.data ? undefined : trend.data.sensSlope}
          projection={analysable ? outlook?.path : undefined} />}
      {!loading && analysable && trend.data && outlook && (
        <TrendProjection projection={outlook.listed} unit={scaleCopy.unit} significant={trend.data.isSignificant} />
      )}

      <DetectiveExportActions
        seriesData={seriesData}
        variable={variable}
        location={location}
        year={year}
        unit={OBSERVATION_SCALES[variable].unit}
        isObserved={analysable}
      />

      <footer className="inspection-provenance">
        {!loading && !analysable && <p>{formatTemplate(t.inspection.noSamplesWithinRadius, { radius: supportRadiusDegrees })}</p>}
        <p>{analysable ? provenanceLabelLocalized(provenance, locale) : t.inspection.noSampleForLocation}</p>
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
        )} <span>{!analysable ? t.inspection.notCalculated : trend.loading ? t.inspection.calculating
          : trend.error ? t.inspection.unavailable : trend.data ? `${trend.data.sensSlope >= 0 ? '+' : ''}${trend.data.sensSlope.toLocaleString(tag,
            { maximumFractionDigits: 3 })} ${unit} · p = ${trend.data.pValue.toLocaleString(tag, { maximumSignificantDigits: 2 })}${
            trend.data.isSignificant ? ` · ${t.inspection.significant}` : ` · ${t.inspection.notSignificant}`}` : t.inspection.notCalculated}</span></p>
        {analysable && trend.data && <TrendMethods trend={trend.data} unit={unit} />}
      </footer>
    </aside>
  );
}
