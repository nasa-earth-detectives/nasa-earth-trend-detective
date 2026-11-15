import { getRegionalBiomeContext } from '../../utils/regionalContext';
import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationSource } from '../../types/observationLayer.types';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import { useCellTrend } from '../../hooks/useCellTrend';
import { provenanceLabel } from '../../services/datasetCatalog';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { formatCoordinate } from '../../utils/detectiveAnalysis';
import { TrendSignificanceBadge } from './TrendSignificanceBadge';
import { TimeSeriesChart } from './TimeSeriesChart';
import { TrendMethods } from './TrendMethods';
import { DetectiveExportActions } from './DetectiveExportActions';
import { sampleDemoObservation } from '../../services/demo/observationDemoData';
import { getObservationValue, OBSERVATION_SCALES } from '../../utils/colorScales';
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable);
  const trend = useCellTrend(variable, open && source === 'api' ? provenance : null, observation);
  const unit = provenance?.trendUnit ?? `${OBSERVATION_SCALES[variable].unit} / year`;
  const biomeInfo = location ? getRegionalBiomeContext(location.lat, location.lng) : null;

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

  return (
    <aside id="tour-detective-card" className="inspection-instrument scrollbar-instrument"
      aria-labelledby="inspection-title" data-ui-control>
      <header className="inspection-header">
        <div>
          <p>{observation && !nearby ? 'Center of selected cell' : 'Selected location'}</p>
          <h2 id="inspection-title">Regional inspection</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspection-close focus-ring"
          aria-label="Close inspector">
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <dl className="inspection-coordinates">
        <div><dt>Latitude</dt><dd title={String(location.lat)}>{formatCoordinate(location.lat, 'N', 'S')}</dd></div>
        <div><dt>Longitude</dt><dd title={String(location.lng)}>{formatCoordinate(location.lng, 'E', 'W')}</dd></div>
      </dl>

      {biomeInfo && (
        <div className="inspection-biome">
          <p className="inspection-biome-title">{biomeInfo.biome}</p>
          <p className="inspection-biome-note">{biomeInfo.contextNote}</p>
        </div>
      )}

      {nearby && observation && <div className="inspection-provenance">
        <p>Nearest sample · {observationDistanceDegrees?.toLocaleString('en-US', { maximumFractionDigits: 2 })}° from selected point</p>
        <p title={`${observation.latitude}, ${observation.longitude}`}>
          {formatCoordinate(observation.latitude, 'N', 'S')} · {formatCoordinate(observation.longitude, 'E', 'W')}
        </p>
        <p>The reading corresponds to this sample, not the selected point.</p>
      </div>}

      <div className="inspection-variable">
        <p>{metadata?.name}</p>
        <p><span>Reference product</span><strong>{metadata?.satelliteMission}</strong></p>
      </div>

      <div className="inspection-series-heading">
        <h3>{loading ? 'Querying observations' : !observation ? 'No nearby sample' : source === 'demo' ? 'Simulated scenario series'
          : trend.data ? 'Observed annual series' : 'Available observation'}</h3>
        <span>{observation && source === 'demo' ? `${SATELLITE_TIMELINE.startYear}—${SATELLITE_TIMELINE.endYear}` : seriesYears}</span>
      </div>
      {loading ? <p className="inspection-chart__empty">Querying selected year…</p> :
        <TimeSeriesChart data={seriesData} unit={OBSERVATION_SCALES[variable].unit}
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
        {!loading && !observation && <p>No samples for this variable within {supportRadiusDegrees}° in the active coverage.</p>}
        <p>{source === 'demo' ? 'Synthetic data · not NASA observations.' :
          observation ? provenanceLabel(provenance) : 'No sample received for this location.'}</p>
        <p>{variable === 'Gistemp'
          ? 'Red: warmer · blue: cooler relative to reference baseline. Not absolute temperature.'
          : `${OBSERVATION_SCALES[variable].label}.`}</p>
        <p>Mann–Kendall / Sen {trend.data && (
          <TrendSignificanceBadge result={{
            isSignificant: trend.data.isSignificant,
            pValue: trend.data.pValue,
            sensSlope: trend.data.sensSlope,
            zScore: trend.data.zScore,
            survivesPersistence: trend.data.prewhitened?.isSignificant,
          }} variable={variable} unit={unit} />
        )} <span>{source === 'demo' || !observation ? 'Not calculated' : trend.loading ? 'Calculating…'
          : trend.error ? 'Unavailable' : trend.data ? `${trend.data.sensSlope >= 0 ? '+' : ''}${trend.data.sensSlope.toLocaleString('en-US',
            { maximumFractionDigits: 3 })} ${unit} · p = ${trend.data.pValue.toLocaleString('en-US', { maximumSignificantDigits: 2 })}${
            trend.data.isSignificant ? ' · significant' : ' · not significant'}` : 'Not calculated'}</span></p>
        {source === 'api' && observation && trend.data && <TrendMethods trend={trend.data} unit={unit} />}
      </footer>
    </aside>
  );
}
