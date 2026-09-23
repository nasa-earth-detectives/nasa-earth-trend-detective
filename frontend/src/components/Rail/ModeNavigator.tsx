import { Crosshair, History, Orbit, Scan } from 'lucide-react';
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
}

/** Instrumentos persistentes; cada acceso conserva la lectura del contexto que abre. */
export function ModeNavigator({ mode, variable, year, onModeChange, onRecenter, onInspectCenter }: ModeNavigatorProps) {
  const lens = OBSERVATION_LENSES[variable];
  const instruments = [
    { mode: 'layers', label: 'Variables', detail: lens.domain, panel: 'layer-panel', symbol: lens.symbol },
    { mode: 'time', label: 'Tiempo', detail: `Año seleccionado · ${year}`, panel: 'mission-time-navigator', symbol: <History size={19} /> },
    { mode: 'view', label: 'Escena', detail: 'Órbita y referencias', panel: 'layer-panel', symbol: <Orbit size={19} /> },
  ] as const;
  return (
    <nav id="tour-mode-navigator" className="mode-navigator" aria-label="Explorar la Tierra" data-ui-control>
      <p className="mode-index-label">Instrumentos de observación</p>
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
        <button type="button" className="recenter-control focus-ring" onClick={onInspectCenter}
          data-mode-trigger="inspection" aria-label="Inspeccionar centro de la Tierra" title="Inspeccionar centro de la Tierra">
          <Scan size={16} aria-hidden="true" /><span>Inspeccionar ubicación</span>
        </button>
        <button type="button" className="recenter-control focus-ring" onClick={onRecenter}
          aria-label="Recentrar la Tierra" title="Recentrar la Tierra">
          <Crosshair size={16} aria-hidden="true" /><span>Recentrar planeta</span>
        </button>
      </div>
    </nav>
  );
}
