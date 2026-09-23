import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { TrendFilterParams } from '../../types/trend.types';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { applyScienceAccent } from '../../config/scienceTheme';
import { useImmersiveUi } from '../../hooks/useImmersiveUi';
import { useSceneControls } from '../../hooks/useSceneControls';
import { useIdleUi } from '../../hooks/useIdleUi';
import { filterObservationCoverage } from '../../services/demo/observationDemoData';
import { findNearbyObservation } from '../../utils/observationLookup';
import type { ObservationCoverage, ObservationLayerMode, ObservationSource } from '../../types/observationLayer.types';
import { GlobeViewer } from '../Globe/GlobeViewer';
import { EARTH_HEAT_CONFIG } from '../Globe/earthHeatRaster';
import type { GlobeSceneApi } from '../Globe/useGlobeScene';
import { MissionHeader } from '../Mission/MissionHeader';
import { ObservationReadout } from '../Mission/ObservationReadout';
import { ObservationContext } from '../Mission/ObservationContext';
import { ModeNavigator } from '../Rail/ModeNavigator';
import { LayerPanel } from '../Layers/LayerPanel';
import { DetectiveCard } from '../Detective/DetectiveCard';
import { TimeNavigator } from '../Controls/TimeNavigator';
import { guidedTourService } from '../../services/guidedTourService';
import '../../styles/workspace.css';
import '../../styles/instrument-chrome.css';
import '../../styles/guided-tour.css';
import '../../styles/hex-instrument.css';

interface ImmersiveEarthLayoutProps {
  observations: ClimateObservation[];
  loading: boolean;
  observationError: string | null;
  source: ObservationSource;
  filter: TrendFilterParams;
  onVariableChange: (variable: ClimateVariable) => void;
  onYearChange: (year: number) => void;
}

/** Un único espacio WebGL; cada intención reorganiza los instrumentos DOM. */
export function ImmersiveEarthLayout({ observations, loading, observationError, source, filter,
  onVariableChange, onYearChange }: ImmersiveEarthLayoutProps) {
  const sceneApiRef = useRef<GlobeSceneApi | null>(null);
  const ui = useImmersiveUi();
  const scene = useSceneControls(sceneApiRef);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [observationMode, setObservationMode] = useState<ObservationLayerMode>('hex');
  const [coverage, setCoverage] = useState<ObservationCoverage>('land');
  const [selectedObservation, setSelectedObservation] = useState<ClimateObservation | null>(null);
  const visibleObservations = useMemo(() => source === 'demo'
    ? filterObservationCoverage(observations, coverage) : observations, [observations, coverage, source]);
  const inspectionMatch = useMemo(() => loading || observationError ? null : findNearbyObservation(
    visibleObservations, ui.location, filter.variable, EARTH_HEAT_CONFIG.radiusDegrees,
  ), [visibleObservations, ui.location, filter.variable, loading, observationError]);
  const layerVisible = observationMode !== 'none';
  const panelOpen = ui.mode === 'layers' || ui.mode === 'view';
  const timeOpen = ui.mode === 'time';
  const isIdle = useIdleUi({ disabled: ui.mode !== 'observation' || isPlaying || tourRunning });

  useEffect(() => applyScienceAccent(filter.variable, document.documentElement), [filter.variable]);
  useEffect(() => () => guidedTourService.stopTour(), []);
  useEffect(() => {
    sceneApiRef.current?.setObservationSelectHandler(setSelectedObservation);
    return () => sceneApiRef.current?.setObservationSelectHandler(null);
  }, []);
  useEffect(() => {
    if (!loading) sceneApiRef.current?.setObservationData(observationError ? [] : visibleObservations, filter.variable);
  }, [visibleObservations, filter.variable, loading, observationError]);
  useEffect(() => {
    sceneApiRef.current?.setObservationMode(observationMode);
    if (observationMode !== 'hex') setSelectedObservation(null);
  }, [observationMode]);
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

  const handleCloseInspector = useCallback(() => {
    ui.observe();
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-mode-trigger="inspection"]')?.focus());
  }, [ui.observe]);

  const handleStartTour = () => {
    guidedTourService.startMissionTour({
      onResetView: () => {
        ui.observe();
      },
      onOpenTime: () => {
        ui.openMode('time');
      },
      onOpenInspector: () => {
        if (ui.location) ui.selectLocation(ui.location);
        else sceneApiRef.current?.inspectCenter();
      },
      onRunningChange: setTourRunning,
    });
  };

  return (
    <main className="earth-workspace" data-mode={ui.mode} data-idle={isIdle}
      data-hex-visible={layerVisible} data-hex-selected={selectedObservation !== null} data-observation-layer={observationMode}>
      <GlobeViewer apiRef={sceneApiRef} preferencesRef={scene.preferencesRef} />
      <div className="observation-position quiet-instrument">
        <ObservationContext variable={filter.variable} />
      </div>
      <div className="mission-position quiet-instrument">
        <MissionHeader onStartTour={handleStartTour} />
      </div>
      <div className="system-position quiet-instrument" data-hex-active={true}>
        <ObservationReadout observations={visibleObservations} variable={filter.variable} year={filter.endYear}
          source={source} mode={observationMode} coverage={coverage} loading={loading} error={observationError}
          selected={selectedObservation} onSelect={id => sceneApiRef.current?.setObservationSelection(id)} />
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
        <span>{observationMode === 'hex' ? 'Selecciona una columna para inspeccionar su observación' : 'Selecciona la superficie para inspeccionar'}</span>
      </p>
      <LayerPanel id="layer-panel" open={panelOpen} onClose={ui.observe}
        activeTab={ui.mode === 'view' ? 'view' : 'data'} onTabChange={ui.setLayerTab}
        selectedVariable={filter.variable} onVariableSelect={onVariableChange}
        autoRotate={scene.preferences.autoRotate} starsVisible={scene.preferences.starsVisible}
        gridVisible={scene.preferences.gridVisible} atmosphereVisible={scene.preferences.atmosphereVisible}
        observationMode={observationMode} onObservationModeChange={setObservationMode}
        coverage={coverage} onCoverageChange={setCoverage} source={source}
        onAutoRotateChange={scene.setAutoRotate} onStarsChange={scene.setStarsVisible}
        onGridChange={scene.setGridVisible} onAtmosphereChange={scene.setAtmosphereVisible} />
      <DetectiveCard
        open={ui.mode === 'inspection'}
        location={ui.location}
        variable={filter.variable}
        year={filter.endYear}
        source={source}
        observation={inspectionMatch?.observation ?? null}
        observationDistanceDegrees={inspectionMatch?.distanceDegrees ?? null}
        supportRadiusDegrees={EARTH_HEAT_CONFIG.radiusDegrees}
        loading={loading}
        onClose={handleCloseInspector}
        onYearChange={onYearChange}
      />
    </main>
  );
}
