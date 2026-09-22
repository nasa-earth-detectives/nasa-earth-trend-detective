import { useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateVariable } from '../../types/climate.types';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';

interface LocationInstrumentProps {
  open: boolean;
  location: SelectedLocation | null;
  variable: ClimateVariable;
  year: number;
  onClose: () => void;
}

function coordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;
}

/** Inspección de coordenadas de la superficie; no inventa resultados regionales. */
export function LocationInstrument({ open, location, variable, year, onClose }: LocationInstrumentProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable);
  useEffect(() => { if (open) closeRef.current?.focus({ preventScroll: true }); }, [open]);
  return (
    <section className="location-instrument" data-open={open} inert={!open} data-ui-control
      aria-label="Inspección de ubicación" aria-hidden={!open}>
      <header><p><MapPin size={16} aria-hidden="true" />Ubicación seleccionada</p>
        <button ref={closeRef} type="button" className="tactile-control focus-ring"
          onClick={onClose} aria-label="Cerrar inspección"><X size={18} /></button></header>
      {location && <>
        <div className="location-coordinates" key={`${location.lat},${location.lng}`}>
          <p><small>Latitud</small><strong>{coordinate(location.lat, 'N', 'S')}</strong></p>
          <p><small>Longitud</small><strong>{coordinate(location.lng, 'E', 'O')}</strong></p>
        </div>
        <p className="location-source">{metadata?.name}<br />{metadata?.satelliteMission} <span>/ {year}</span></p>
        <p className="location-empty">El análisis regional aún no está disponible.</p>
        <p className="location-helper">Selecciona otro punto sobre la Tierra para cambiar de ubicación.</p>
      </>}
    </section>
  );
}
