import { Crosshair, History, MapPin, Orbit, Scan } from 'lucide-react';
import type { InstrumentMode } from '../../hooks/useImmersiveUi';
import type { ClimateVariable } from '../../types/climate.types';
import { OBSERVATION_LENSES } from '../../config/observationLenses';
import { formatTemplate, useI18n } from '../../i18n';

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
  const { t } = useI18n();
  const lens = OBSERVATION_LENSES[variable];
  const instruments = [
    { mode: 'layers', label: t.rail.variables, detail: t.lenses[variable].domain, panel: 'layer-panel', symbol: lens.symbol },
    { mode: 'time', label: t.rail.time, detail: formatTemplate(t.rail.timeDetail, { year }), panel: 'mission-time-navigator', symbol: <History size={19} /> },
    { mode: 'view', label: t.rail.scene, detail: t.rail.sceneDetail, panel: 'layer-panel', symbol: <Orbit size={19} /> },
  ] as const;

  return (
    <nav id="tour-mode-navigator" className="mode-navigator" aria-label={t.rail.navAria} data-ui-control>
      <p className="mode-index-label">{t.rail.indexLabel}</p>
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
      <div id="tour-scene-utilities" className="scene-utilities">
        {onLocateUser && (
          <button
            type="button"
            className="recenter-control focus-ring"
            onClick={onLocateUser}
            disabled={locating}
            data-mode-trigger="locate"
            aria-label={t.rail.locateAria}
            title={t.rail.locateAria}
          >
            <MapPin size={16} aria-hidden="true" />
            <span>{locating ? t.rail.locating : t.rail.locate}</span>
          </button>
        )}
        <button type="button" className="recenter-control focus-ring" onClick={onInspectCenter}
          data-mode-trigger="inspection" aria-label={t.rail.inspectAria} title={t.rail.inspectAria}>
          <Scan size={16} aria-hidden="true" /><span>{t.rail.inspect}</span>
        </button>
        <button type="button" className="recenter-control focus-ring" onClick={onRecenter}
          aria-label={t.rail.recenterAria} title={t.rail.recenterAria}>
          <Crosshair size={16} aria-hidden="true" /><span>{t.rail.recenter}</span>
        </button>
      </div>
    </nav>
  );
}
