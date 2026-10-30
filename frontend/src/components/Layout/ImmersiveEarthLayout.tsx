import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import type { TrendFilterParams } from '../../types/trend.types';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { applyScienceAccent } from '../../config/scienceTheme';
import { useImmersiveUi, type SelectedLocation } from '../../hooks/useImmersiveUi';
import { useSceneControls } from '../../hooks/useSceneControls';
import { useIdleUi } from '../../hooks/useIdleUi';
import { useUserGeolocation } from '../../hooks/useUserGeolocation';
import { findNearbyObservation } from '../../utils/observationLookup';
import { useVisibleObservations } from '../../hooks/useVisibleObservations';
import { useHexData } from '../../hooks/useHexData';
import { useTeleconnections } from '../../hooks/useTeleconnections';
import type { GlobeReading, ObservationCoverage, ObservationLayerMode, ObservationSource } from '../../types/observationLayer.types';
import type { HexCell } from '../../types/hex.types';
import { GlobeViewer } from '../Globe/GlobeViewer';
import { EARTH_HEAT_CONFIG } from '../Globe/earthHeatRaster';
import type { GlobeSceneApi } from '../Globe/useGlobeScene';
import { MissionHeader } from '../Mission/MissionHeader';
import { ObservationReadout } from '../Mission/ObservationReadout';
import { HexReadout } from '../Mission/HexReadout';
import { ObservationContext } from '../Mission/ObservationContext';
import { ModeNavigator } from '../Rail/ModeNavigator';
import { LayerPanel } from '../Layers/LayerPanel';
import { DetectiveCard } from '../Detective/DetectiveCard';
import { DetectiveMissionsModal, type MissionPreset } from '../Detective/DetectiveMissionsModal';
import { DetectiveGlossaryModal } from '../Detective/DetectiveGlossaryModal';
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
  provenance: DatasetProvenance | null;
  filter: TrendFilterParams;
  initialLocation?: SelectedLocation | null;
  onVariableChange: (variable: ClimateVariable) => void;
  onYearChange: (year: number) => void;
  onOpenWizard?: () => void;
}

/** Un único espacio WebGL; cada intención reorganiza los instrumentos DOM. */
export function ImmersiveEarthLayout({
  observations, loading, observationError, source, provenance, filter,
  initialLocation = null, onVariableChange, onYearChange, onOpenWizard,
}: ImmersiveEarthLayoutProps) {
  const sceneApiRef = useRef<GlobeSceneApi | null>(null);
  const ui = useImmersiveUi(initialLocation);
  const scene = useSceneControls(sceneApiRef);
  const geo = useUserGeolocation();
  useTeleconnections(sceneApiRef);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [observationMode, setObservationMode] = useState<ObservationLayerMode>('hex');
  const [reading, setReading] = useState<GlobeReading>('annual');
  const [coverage, setCoverage] = useState<ObservationCoverage>('land');
  const [selectedObservation, setSelectedObservation] = useState<ClimateObservation | null>(null);
  const [selectedTrendCell, setSelectedTrendCell] = useState<HexCell | null>(null);
  const trendReading = reading === 'trend';
  const hexData = useHexData(filter, trendReading);
  const visibleObservations = useVisibleObservations(observations, source, coverage, provenance);
  const inspectionMatch = useMemo(() => loading || observationError ? null : findNearbyObservation(
    visibleObservations, ui.location, filter.variable, EARTH_HEAT_CONFIG.radiusDegrees,
  ), [visibleObservations, ui.location, filter.variable, loading, observationError]);
  const layerVisible = observationMode !== 'none';
  const panelOpen = ui.mode === 'layers' || ui.mode === 'view';
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
    sceneApiRef.current?.setReadingMode?.(reading);
    setSelectedTrendCell(null);
    if (reading === 'trend') setSelectedObservation(null);
  }, [reading]);
  useEffect(() => {
    const api = sceneApiRef.current;
    api?.setTrendCellSelectHandler?.(setSelectedTrendCell);
    return () => api?.setTrendCellSelectHandler?.(null);
  }, []);
  useEffect(() => {
    if (!trendReading) return;
    sceneApiRef.current?.setTrendData?.(hexData.data);
    setSelectedTrendCell(null);
  }, [trendReading, hexData.data]);
  useEffect(() => {
    sceneApiRef.current?.setLocationSelectHandler(ui.selectLocation);
    return () => sceneApiRef.current?.setLocationSelectHandler(null);
  }, [ui.selectLocation]);
  useEffect(() => {
    if (initialLocation) sceneApiRef.current?.setUserLocation?.(initialLocation);
  }, [initialLocation]);
  useEffect(() => {
    const updateOffset = () => {
      const offset = panelOpen && window.innerWidth >= 1024 ? -Math.min(210, Math.max(110, window.innerWidth * 0.1)) : 0;
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

  const handleLocateUser = useCallback(async () => {
    const coords = await geo.requestLocation();
    if (coords) {
      sceneApiRef.current?.setUserLocation?.(coords);
      sceneApiRef.current?.flyToGodsEye?.(coords.lat, coords.lng, 0.45, 1800);
      ui.selectLocation({ lat: coords.lat, lng: coords.lng });
    }
  }, [geo.requestLocation, ui.selectLocation]);

    const handleSelectMission = useCallback((mission: MissionPreset) => {
    onVariableChange(mission.variable);
    onYearChange(mission.year);
    sceneApiRef.current?.flyToGodsEye?.(mission.location.lat, mission.location.lng, 0.45, 1500);
    ui.selectLocation(mission.location);
  }, [onVariableChange, onYearChange, ui.selectLocation]);

  const handleStartTour = () => guidedTourService.startMissionTour({
    onResetView: ui.observe, onOpenTime: () => ui.openMode('time'),
    onOpenInspector: () => {
      if (ui.location) ui.selectLocation(ui.location);
      else sceneApiRef.current?.inspectCenter();
    },
    onRunningChange: setTourRunning,
  });

  return (
    <main className="earth-workspace" data-mode={ui.mode} data-idle={isIdle}
      data-hex-visible={layerVisible} data-hex-selected={selectedObservation !== null} data-observation-layer={observationMode} data-reading={reading}>
      <GlobeViewer apiRef={sceneApiRef} preferencesRef={scene.preferencesRef} />
      <div className="observation-position quiet-instrument"><ObservationContext variable={filter.variable} /></div>
      <div className="mission-position quiet-instrument"><MissionHeader onStartTour={handleStartTour} onOpenWizard={onOpenWizard} onOpenMissions={() => setMissionsOpen(true)} onOpenGlossary={() => setGlossaryOpen(true)} /></div>
      <div className="system-position quiet-instrument" data-hex-active={true}>
        {trendReading ? (
          <HexReadout data={hexData.data} loading={hexData.loading} error={hexData.error}
            selectedCell={selectedTrendCell} onSelectCell={id => sceneApiRef.current?.setObservationSelection(id)} />
        ) : (
          <ObservationReadout observations={visibleObservations} variable={filter.variable} year={filter.endYear}
            source={source} provenance={provenance} mode={observationMode} coverage={coverage} loading={loading} error={observationError}
            selected={selectedObservation} onSelect={id => sceneApiRef.current?.setObservationSelection(id)} />
        )}
      </div>
      <div className="intent-position quiet-instrument">
        <ModeNavigator mode={ui.mode} variable={filter.variable} year={filter.endYear}
          onModeChange={ui.toggleMode} onRecenter={scene.resetCamera} onInspectCenter={() => sceneApiRef.current?.inspectCenter()}
          onLocateUser={handleLocateUser} locating={geo.status === 'locating'} />
      </div>
      <div id="tour-time-navigator" className="time-position quiet-instrument" data-expanded={ui.mode === 'time'}
        inert={panelOpen || ui.mode === 'inspection'}>
        <TimeNavigator startYear={SATELLITE_TIMELINE.startYear} endYear={SATELLITE_TIMELINE.endYear}
          currentYear={filter.endYear} missionLabel={mission} onChange={onYearChange}
          collapsed={ui.mode !== 'time'} onToggleCollapsed={() => ui.toggleMode('time')} onPlaybackChange={setIsPlaying} />
      </div>
      <p className="scene-guidance quiet-instrument">
        <span className="guidance-desktop">Arrastra para orbitar · Desplaza para acercar</span>
        <span className="guidance-touch">Arrastra para orbitar · Pellizca para acercar</span>
        <span>{trendReading ? 'Cada columna es el ritmo de cambio de una celda; selecciónala para leerla'
          : observationMode === 'hex' ? 'Selecciona una columna para inspeccionar su observación' : 'Selecciona la superficie para inspeccionar'}</span>
      </p>
      <LayerPanel id="layer-panel" open={panelOpen} onClose={ui.observe}
        activeTab={ui.mode === 'view' ? 'view' : 'data'} onTabChange={ui.setLayerTab}
        selectedVariable={filter.variable} onVariableSelect={onVariableChange}
        autoRotate={scene.preferences.autoRotate} starsVisible={scene.preferences.starsVisible}
        gridVisible={scene.preferences.gridVisible} atmosphereVisible={scene.preferences.atmosphereVisible}
        oceanFlowVisible={scene.preferences.oceanFlowVisible} teleconnectionsVisible={scene.preferences.teleconnectionArcsVisible}
        radarRipplesVisible={scene.preferences.radarRipplesVisible} satellitesVisible={scene.preferences.satellitesVisible}
        observationMode={observationMode} onObservationModeChange={setObservationMode}
        reading={reading} onReadingChange={setReading} coverage={coverage} onCoverageChange={setCoverage}
        onAutoRotateChange={scene.setAutoRotate} onStarsChange={scene.setStarsVisible}
        onGridChange={scene.setGridVisible} onAtmosphereChange={scene.setAtmosphereVisible}
        onOceanFlowChange={scene.setOceanFlowVisible} onTeleconnectionsChange={scene.setTeleconnectionsVisible}
        onRadarRipplesChange={scene.setRadarRipplesVisible} onSatellitesChange={scene.setSatellitesVisible} />
      <DetectiveCard open={ui.mode === 'inspection'} location={ui.location} variable={filter.variable}
        year={filter.endYear} source={source} provenance={provenance} observation={inspectionMatch?.observation ?? null}
        observationDistanceDegrees={inspectionMatch?.distanceDegrees ?? null} supportRadiusDegrees={EARTH_HEAT_CONFIG.radiusDegrees}
        loading={loading} onClose={handleCloseInspector} onYearChange={onYearChange} />
          <DetectiveMissionsModal open={missionsOpen} onClose={() => setMissionsOpen(false)} onSelectMission={handleSelectMission} />
      <DetectiveGlossaryModal open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </main>
  );
}
