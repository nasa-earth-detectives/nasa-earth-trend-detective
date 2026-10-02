import type { GlobeInstance } from 'globe.gl';
import type { Points } from 'three';
import { GLOBE_CONFIG } from './globeConfig';
import type { EarthLiveSystemApi } from './earthLiveSystem';
import type { GlobeLocation, GlobeSceneApi } from '../../types/globe.types';

export interface GlobeSceneContext {
  analysis: {
    updateData: any;
    setMode: any;
    select: any;
    setOnObservationSelect: any;
  };
  surface: {
    setAtmosphereVisible: (visible: boolean) => void;
  };
  liveSystem: EarthLiveSystemApi;
  globe: GlobeInstance;
  starLayers: Points[];
  focusOffset: {
    set: (offsetPx: number, verticalOffsetPx?: number) => void;
  };
  setAutoRotatePreferred: (enabled: boolean) => void;
  syncAutoRotate: () => void;
  setCameraOwned: (owned: boolean) => void;
  moveToInitialPov: (transitionMs: number) => void;
  reducedMotion: MediaQueryList;
  getLocationSelectHandler: () => ((location: GlobeLocation) => void) | null;
  setLocationSelectHandler: (handler: ((location: GlobeLocation) => void) | null) => void;
}

/** Construye la interfaz imperativa externa de la escena 3D. */
export function buildGlobeSceneApi(ctx: GlobeSceneContext): GlobeSceneApi {
  return {
    setObservationData: ctx.analysis.updateData,
    setObservationMode: ctx.analysis.setMode,
    setObservationSelection: ctx.analysis.select,
    setObservationSelectHandler: ctx.analysis.setOnObservationSelect,
    setAutoRotateEnabled: (enabled) => {
      ctx.setAutoRotatePreferred(enabled);
      ctx.syncAutoRotate();
    },
    setStarsVisible: (visible) => {
      ctx.starLayers.forEach((layer) => { layer.visible = visible; });
    },
    setGridVisible: (visible) => { ctx.globe.showGraticules(visible); },
    setAtmosphereVisible: ctx.surface.setAtmosphereVisible,
    setTeleconnectionArcsVisible: ctx.liveSystem.setArcsVisible,
    setRadarRipplesVisible: ctx.liveSystem.setRipplesVisible,
    setSatellitesVisible: ctx.liveSystem.setSatellitesVisible,
    setOceanFlowVisible: ctx.liveSystem.setOceanFlowVisible,
    flyToGodsEye: (lat, lng, altitude = 0.28, durationMs = 1600) => {
      ctx.setCameraOwned(true);
      ctx.globe.pointOfView({ lat, lng, altitude }, durationMs);
    },
    setLocationSelectHandler: (handler) => { ctx.setLocationSelectHandler(handler); },
    inspectCenter: () => {
      ctx.analysis.select(null);
      const { lat, lng } = ctx.globe.pointOfView();
      ctx.getLocationSelectHandler()?.({ lat, lng });
    },
    resetCamera: () => {
      ctx.setCameraOwned(false);
      ctx.moveToInitialPov(ctx.reducedMotion.matches ? 0 : GLOBE_CONFIG.resetCameraMs);
    },
    setFocusOffset: (offsetPx, verticalOffsetPx) => ctx.focusOffset.set(offsetPx, verticalOffsetPx),
  };
}
