import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationSource } from '../../types/observationLayer.types';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { formatCoordinate } from '../../utils/detectiveAnalysis';
import { TimeSeriesChart } from './TimeSeriesChart';
import { sampleDemoObservation } from '../../services/demo/observationDemoData';
import { getObservationValue, OBSERVATION_SCALES } from '../../utils/colorScales';
import '../../styles/inspection.css';

interface DetectiveCardProps {
  open: boolean;
  location: SelectedLocation | null;
  variable: ClimateVariable;
  year: number;
  source: ObservationSource;
  observation: ClimateObservation | null;
  observationDistanceDegrees: number | null;
  supportRadiusDegrees: number;
  loading: boolean;
  onClose: () => void;
  onYearChange?: (year: number) => void;
}

/** Coordenadas reales y una serie de demostración explícita hasta integrar la consulta regional. */
export function DetectiveCard({ open, location, variable, year, source, observation, observationDistanceDegrees,
  supportRadiusDegrees, loading, onClose, onYearChange }: DetectiveCardProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable);

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
    // Una respuesta API anual no autoriza inventar una serie temporal regional.
    if (source === 'api') return [{ year, value: getObservationValue(observation) }];
    return Array.from({ length: SATELLITE_TIMELINE.endYear - SATELLITE_TIMELINE.startYear + 1 }, (_, index) => {
      const sampleYear = SATELLITE_TIMELINE.startYear + index;
      return { year: sampleYear, value: getObservationValue(sampleDemoObservation(variable, sampleYear,
        observation.latitude, observation.longitude)) };
    });
  }, [variable, source, observation, year, loading]);

  if (!open || !location) return null;
  const nearby = observation !== null && (observationDistanceDegrees ?? 0) > 1e-7;

  return (
    <aside id="tour-detective-card" className="inspection-instrument scrollbar-instrument"
      aria-labelledby="inspection-title" data-ui-control>
      <header className="inspection-header">
        <div>
          <p>{observation && !nearby ? 'Centro de la celda seleccionada' : 'Ubicación seleccionada'}</p>
          <h2 id="inspection-title">Inspección regional</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspection-close focus-ring"
          aria-label="Cerrar inspector">
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <dl className="inspection-coordinates">
        <div><dt>Latitud</dt><dd title={String(location.lat)}>{formatCoordinate(location.lat, 'N', 'S')}</dd></div>
        <div><dt>Longitud</dt><dd title={String(location.lng)}>{formatCoordinate(location.lng, 'E', 'O')}</dd></div>
      </dl>

      {nearby && observation && <div className="inspection-provenance">
        <p>Muestra más cercana · {observationDistanceDegrees?.toLocaleString('es', { maximumFractionDigits: 2 })}° del punto elegido</p>
        <p title={`${observation.latitude}, ${observation.longitude}`}>
          {formatCoordinate(observation.latitude, 'N', 'S')} · {formatCoordinate(observation.longitude, 'E', 'O')}
        </p>
        <p>La lectura corresponde a esta muestra, no al punto seleccionado.</p>
      </div>}

      <div className="inspection-variable">
        <p>{metadata?.name}</p>
        <p><span>Producto de referencia</span><strong>{metadata?.satelliteMission}</strong></p>
      </div>

      <div className="inspection-series-heading">
        <h3>{loading ? 'Consultando observaciones' : !observation ? 'Sin muestra cercana' : source === 'demo' ? 'Serie del escenario simulado' : 'Observación disponible'}</h3>
        <span>{observation && source === 'demo' ? `${SATELLITE_TIMELINE.startYear}—${SATELLITE_TIMELINE.endYear}` : year}</span>
      </div>
      {loading ? <p className="inspection-chart__empty">Consultando el año seleccionado…</p> :
        <TimeSeriesChart data={seriesData} unit={OBSERVATION_SCALES[variable].unit}
          selectedYear={year} onYearSelect={onYearChange} />}

      <footer className="inspection-provenance">
        {!loading && !observation && <p>No hay muestras de esta variable a menos de {supportRadiusDegrees}° dentro de la cobertura activa.</p>}
        <p>{source === 'demo' ? 'Datos sintéticos · no son observaciones NASA.' :
          observation ? 'Observación recibida de la API · serie histórica pendiente.' : 'Sin muestra recibida para esta ubicación.'}</p>
        <p>{variable === 'Gistemp'
          ? 'Rojo: más cálido · azul: más frío respecto al promedio de referencia. No es temperatura absoluta.'
          : `${OBSERVATION_SCALES[variable].label}.`}</p>
        <p>Mann–Kendall / Sen <span>Sin calcular</span></p>
      </footer>
    </aside>
  );
}
