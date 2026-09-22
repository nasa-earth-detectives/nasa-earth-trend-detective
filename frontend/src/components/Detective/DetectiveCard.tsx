import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateVariable } from '../../types/climate.types';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { formatCoordinate } from '../../utils/detectiveAnalysis';
import { TimeSeriesChart } from './TimeSeriesChart';
import '../../styles/inspection.css';

interface DetectiveCardProps {
  open: boolean;
  location: SelectedLocation | null;
  variable: ClimateVariable;
  year: number;
  onClose: () => void;
  onYearChange?: (year: number) => void;
}

/** Coordenadas reales y una serie de demostración explícita hasta integrar la consulta regional. */
export function DetectiveCard({ open, location, variable, year, onClose, onYearChange }: DetectiveCardProps) {
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
    if (!location) return [];
    // Conserva la serie sintética del prototipo; no calcula ni simula resultados de Mann–Kendall.
    const seed = Math.sin(location.lat * 12.9898 + location.lng * 78.233);
    const trendRate = seed * 0.04 + (variable === 'Gistemp' ? 0.035 : variable === 'GraceMass' ? -1.2 : 0.015);
    const baseValue = variable === 'Gistemp' ? 0.2 : variable === 'Oco2' ? 380 : variable === 'GraceMass' ? 120 : 0.45;
    return Array.from({ length: SATELLITE_TIMELINE.endYear - SATELLITE_TIMELINE.startYear + 1 }, (_, index) => {
      const sampleYear = SATELLITE_TIMELINE.startYear + index;
      const noise = Math.sin(sampleYear * seed) * (variable === 'GraceMass' ? 5 : 0.12);
      return { year: sampleYear, value: Number((baseValue + (sampleYear - 2000) * trendRate + noise).toFixed(3)) };
    });
  }, [location, variable]);

  if (!open || !location) return null;

  return (
    <aside id="tour-detective-card" className="inspection-instrument scrollbar-instrument"
      aria-labelledby="inspection-title" data-ui-control>
      <header className="inspection-header">
        <div>
          <p>Ubicación seleccionada</p>
          <h2 id="inspection-title">Inspección regional</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspection-close focus-ring"
          aria-label="Cerrar inspector">
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <dl className="inspection-coordinates">
        <div><dt>Latitud</dt><dd>{formatCoordinate(location.lat, 'N', 'S')}</dd></div>
        <div><dt>Longitud</dt><dd>{formatCoordinate(location.lng, 'E', 'O')}</dd></div>
      </dl>

      <div className="inspection-variable">
        <p>{metadata?.name}</p>
        <p><span>Producto de referencia</span><strong>{metadata?.satelliteMission}</strong></p>
      </div>

      <div className="inspection-series-heading">
        <h3>Serie de ejemplo</h3>
        <span>{SATELLITE_TIMELINE.startYear}—{SATELLITE_TIMELINE.endYear}</span>
      </div>
      <TimeSeriesChart data={seriesData} unit={metadata?.unit ?? ''}
        selectedYear={year} onYearSelect={onYearChange} />

      <footer className="inspection-provenance">
        <p>Datos sintéticos · no son observaciones NASA.</p>
        <p>Mann–Kendall / Sen <span>Sin calcular</span></p>
      </footer>
    </aside>
  );
}
