import { useEffect, useRef, useState } from 'react';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { TrendFilterParams } from '../../types/trend.types';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { applyScienceAccent } from '../../config/scienceTheme';
import { useImmersiveUi } from '../../hooks/useImmersiveUi';
import { useSceneControls } from '../../hooks/useSceneControls';
import { useIdleUi } from '../../hooks/useIdleUi';
import { GlobeViewer } from '../Globe/GlobeViewer';
import type { GlobeSceneApi } from '../Globe/useGlobeScene';
import { MissionHeader } from '../Mission/MissionHeader';
import { SystemReadout } from '../Mission/SystemReadout';
import { ObservationContext } from '../Mission/ObservationContext';
import { ModeNavigator } from '../Rail/ModeNavigator';
import { LayerPanel } from '../Layers/LayerPanel';
import { DetectiveCard } from '../Detective/DetectiveCard';
import { TimeNavigator } from '../Controls/TimeNavigator';
import { guidedTourService } from '../../services/guidedTourService';
import '../../styles/workspace.css';
import '../../styles/instrument-chrome.css';
import '../../styles/guided-tour.css';

interface ImmersiveEarthLayoutProps {
  observations: ClimateObservation[];
  loading: boolean;
  observationError: string | null;
  apiConnected: boolean;
  filter: TrendFilterParams;
  onVariableChange: (variable: ClimateVariable) => void;
  onYearChange: (year: number) => void;
}

/** Un único espacio WebGL; cada intención reorganiza los instrumentos DOM. */
export function ImmersiveEarthLayout({ observations, loading, observationError, apiConnected, filter,
  onVariableChange, onYearChange }: ImmersiveEarthLayoutProps) {
  const sceneApiRef = useRef<GlobeSceneApi | null>(null);
  const ui = useImmersiveUi();
  const scene = useSceneControls(sceneApiRef);
  const [isPlaying, setIsPlaying] = useState(false);
  const panelOpen = ui.mode === 'layers' || ui.mode === 'view';
  const timeOpen = ui.mode === 'time';
  const isIdle = useIdleUi({ disabled: ui.mode !== 'observation' || isPlaying });

  useEffect(() => applyScienceAccent(filter.variable, document.documentElement), [filter.variable]);
  useEffect(() => {
    sceneApiRef.current?.setLocationSelectHandler(ui.selectLocation);
    return () => sceneApiRef.current?.setLocationSelectHandler(null);
  }, [ui.selectLocation]);
  useEffect(() => {
    const updateOffset = () => {
      const offset = panelOpen && window.innerWidth >= 1024
        ? -Math.min(210, Math.max(110, window.innerWidth * 0.1)) : 0;
      const verticalOffset = panelOpen && window.innerWidth < 1024 && window.innerHeight > window.innerWidth
        ? -Math.min(130, window.innerHeight * 0.15) : 0;
      sceneApiRef.current?.setFocusOffset(offset, verticalOffset);
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [panelOpen]);

  const mission = CLIMATE_VARIABLES.find(item => item.id === filter.variable)?.satelliteMission ?? '';

  const handleStartTour = () => {
    guidedTourService.startMissionTour({
      onResetView: () => {
        ui.observe();
      },
      onOpenTime: () => {
        if (ui.mode !== 'time') {
          ui.toggleMode('time');
        }
      },
      onOpenInspector: () => {
        if (!ui.location) {
          ui.selectLocation({ lat: 4.5709, lng: -74.2973 });
        } else if (ui.mode !== 'inspection') {
          ui.toggleMode('inspection');
        }
      },
    });
  };

  return (
    <main className="earth-workspace" data-mode={ui.mode} data-idle={isIdle}>
      <GlobeViewer apiRef={sceneApiRef} preferencesRef={scene.preferencesRef} />
      <div className="observation-position quiet-instrument">
        <ObservationContext variable={filter.variable} />
      </div>
      <div className="mission-position quiet-instrument">
        <MissionHeader onStartTour={handleStartTour} />
      </div>
      <div className="system-position quiet-instrument">
        <SystemReadout connected={apiConnected} observationCount={observations.length}
          loading={loading} error={observationError} year={filter.endYear} variable={filter.variable} />
      </div>
      <div className="intent-position quiet-instrument">
        <ModeNavigator mode={ui.mode} variable={filter.variable} year={filter.endYear}
          onModeChange={ui.toggleMode} onRecenter={scene.resetCamera}
          onInspectCenter={() => sceneApiRef.current?.inspectCenter()} />
      </div>
      <div id="tour-time-navigator" className="time-position quiet-instrument" data-expanded={timeOpen}
        inert={panelOpen || ui.mode === 'inspection'}>
        <TimeNavigator startYear={SATELLITE_TIMELINE.startYear} endYear={SATELLITE_TIMELINE.endYear}
          currentYear={filter.endYear} missionLabel={mission} onChange={onYearChange}
          collapsed={!timeOpen} onToggleCollapsed={() => ui.toggleMode('time')}
          onPlaybackChange={setIsPlaying} />
      </div>
      <p className="scene-guidance quiet-instrument">
        <span className="guidance-desktop">Arrastra para orbitar · Desplaza para acercar</span>
        <span className="guidance-touch">Arrastra para orbitar · Pellizca para acercar</span>
        <span>Selecciona la superficie para inspeccionar</span>
      </p>
      <LayerPanel id="layer-panel" open={panelOpen} onClose={ui.observe}
        activeTab={ui.mode === 'view' ? 'view' : 'data'} onTabChange={ui.setLayerTab}
        selectedVariable={filter.variable} onVariableSelect={onVariableChange}
        autoRotate={scene.preferences.autoRotate} starsVisible={scene.preferences.starsVisible}
        gridVisible={scene.preferences.gridVisible} atmosphereVisible={scene.preferences.atmosphereVisible}
        onAutoRotateChange={scene.setAutoRotate} onStarsChange={scene.setStarsVisible}
        onGridChange={scene.setGridVisible} onAtmosphereChange={scene.setAtmosphereVisible} />
      <DetectiveCard
        open={ui.mode === 'inspection'}
        location={ui.location}
        variable={filter.variable}
        year={filter.endYear}
        onClose={() => {
          ui.observe();
          requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-mode-trigger="inspection"]')?.focus());
        }}
        onYearChange={onYearChange}
      />
    </main>
  );
}
