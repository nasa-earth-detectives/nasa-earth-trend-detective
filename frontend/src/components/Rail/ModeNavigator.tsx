import { Crosshair, History, MapPin, Orbit, Scan } from 'lucide-react';
import type { InstrumentMode } from '../../hooks/useImmersiveUi';
import type { ClimateVariable } from '../../types/climate.types';
import { OBSERVATION_LENSES } from '../../config/observationLenses';

interface ModeNavigatorProps {
  mode: InstrumentMode;
  variable: ClimateVariable;
  year: number;
  onModeChange: (mode: InstrumentMode) => void;
  onRecenter: () => void;
  onInspectCenter: () => void;
  onLocateUser?: () => void;
  locating?: boolean;
}

/** Persistent instruments; each access preserves the context reading it opens. */
export function ModeNavigator({
  mode,
  variable,
  year,
  onModeChange,
  onRecenter,
  onInspectCenter,
  onLocateUser,
  locating = false,
}: ModeNavigatorProps) {
  const lens = OBSERVATION_LENSES[variable];
  const instruments = [
    { mode: 'layers', label: 'Variables', detail: lens.domain, panel: 'layer-panel', symbol: lens.symbol },
    { mode: 'time', label: 'Time', detail: `Selected year · ${year}`, panel: 'mission-time-navigator', symbol: <History size={19} /> },
    { mode: 'view', label: 'Scene', detail: 'Orbit & references', panel: 'layer-panel', symbol: <Orbit size={19} /> },
  ] as const;

  return (
    <nav id="tour-mode-navigator" className="mode-navigator" aria-label="Explore Earth" data-ui-control>
      <p className="mode-index-label">Observation instruments</p>
      {instruments.map(item => (
        <button key={item.mode} type="button" className="mode-entry focus-ring"
          data-mode-trigger={item.mode} data-selected={mode === item.mode}
          aria-expanded={mode === item.mode} aria-controls={item.panel}
          aria-label={item.label} title={item.label} onClick={() => onModeChange(item.mode)}>
          <span className="mode-number" aria-hidden="true">{item.symbol}</span>
          <span className="mode-label"><span>{item.label}</span><small>{item.detail}</small></span>
          <span className="mode-actuator" aria-hidden="true" />
        </button>
      ))}
      <div className="scene-utilities">
        {onLocateUser && (
          <button
            type="button"
            className="recenter-control focus-ring"
            onClick={onLocateUser}
            disabled={locating}
            data-mode-trigger="locate"
            aria-label="Locate my position on Earth"
            title="Locate my position on Earth"
          >
            <MapPin size={16} aria-hidden="true" />
            <span>{locating ? 'Locating…' : 'My location'}</span>
          </button>
        )}
        <button type="button" className="recenter-control focus-ring" onClick={onInspectCenter}
          data-mode-trigger="inspection" aria-label="Inspect center of Earth" title="Inspect center of Earth">
          <Scan size={16} aria-hidden="true" /><span>Inspect location</span>
        </button>
        <button type="button" className="recenter-control focus-ring" onClick={onRecenter}
          aria-label="Recenter Earth" title="Recenter Earth">
          <Crosshair size={16} aria-hidden="true" /><span>Recenter planet</span>
        </button>
      </div>
    </nav>
  );
}
