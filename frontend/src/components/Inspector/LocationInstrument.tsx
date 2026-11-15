import { useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateVariable } from '../../types/climate.types';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { useI18n } from '../../i18n';

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

/** Surface coordinate inspection; does not fabricate regional results. */
export function LocationInstrument({ open, location, variable, year, onClose }: LocationInstrumentProps) {
  const { t } = useI18n();
  const { compass } = t.readouts;
  const closeRef = useRef<HTMLButtonElement>(null);
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable);
  useEffect(() => { if (open) closeRef.current?.focus({ preventScroll: true }); }, [open]);
  return (
    <section className="location-instrument" data-open={open} inert={!open} data-ui-control
      aria-label={t.inspection.locationInstrumentAria} aria-hidden={!open}>
      <header><p><MapPin size={16} aria-hidden="true" />{t.inspection.locationSelected}</p>
        <button ref={closeRef} type="button" className="tactile-control focus-ring"
          onClick={onClose} aria-label={t.inspection.locationCloseAria}><X size={18} /></button></header>
      {location && <>
        <div className="location-coordinates" key={`${location.lat},${location.lng}`}>
          <p><small>{t.inspection.latitude}</small><strong>{coordinate(location.lat, compass.north, compass.south)}</strong></p>
          <p><small>{t.inspection.longitude}</small><strong>{coordinate(location.lng, compass.east, compass.west)}</strong></p>
        </div>
        <p className="location-source">{t.variables[variable].name}<br />{metadata?.satelliteMission} <span>/ {year}</span></p>
        <p className="location-empty">{t.inspection.locationNotAvailable}</p>
        <p className="location-helper">{t.inspection.locationPickAnother}</p>
      </>}
    </section>
  );
}
