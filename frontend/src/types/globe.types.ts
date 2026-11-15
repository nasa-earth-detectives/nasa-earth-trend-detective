import type { ClimateObservation, ClimateVariable } from './climate.types';
import type { HexCell, HexDataset } from './hex.types';
import type { GlobeReading, ObservationLayerMode } from './observationLayer.types';
import type { Teleconnection } from './teleconnection.types';

/**
 * Types and interfaces for the 3D globe scene (Globe.gl & Three.js).
 * Decoupled to keep useGlobeScene.ts concise (< 170 lines) and comply with Rule 5.
 */

export interface GlobeLocation {
  lat: number;
  lng: number;
}

/** What an analysis covers: a box in degrees around a centre. `point` marks the 2° box of a single spot. */
export interface AnalysisArea {
  lat: number;
  lng: number;
  latRadius: number;
  lngRadius: number;
  point: boolean;
}

/** Imperative surface used by floating UI to interact with the scene. */
export interface GlobeSceneApi {
  setObservationData(data: ClimateObservation[], variable: ClimateVariable): void;
  setObservationMode(mode: ObservationLayerMode): void;
  setObservationSelection(id: string | null): void;
  setObservationSelectHandler(handler: ((observation: ClimateObservation | null) => void) | null): void;
  /** Changes the globe inquiry: annual value or rate of change over the period. */
  setReadingMode?(mode: GlobeReading): void;
  /** Trend cells (Sen). Only takes effect in `trend` reading mode. */
  setTrendData?(dataset: HexDataset | null): void;
  setTrendCellSelectHandler?(handler: ((cell: HexCell | null) => void) | null): void;
  /** User preference for resting rotation. */
  setAutoRotateEnabled(enabled: boolean): void;
  setStarsVisible(visible: boolean): void;
  setGridVisible(visible: boolean): void;
  setAtmosphereVisible(visible: boolean): void;
  setTeleconnectionArcsVisible?(visible: boolean): void;
  setRadarRipplesVisible?(visible: boolean): void;
  setSatellitesVisible?(visible: boolean): void;
  setOceanFlowVisible?(visible: boolean): void;
  /** Teleconnection arcs and rings at their endpoints. */
  setTeleconnections?(connections: Teleconnection[]): void;
  /** Cinematic "God's Eye" maneuver toward a specific observation point. */
  flyToGodsEye?(lat: number, lng: number, altitude?: number, durationMs?: number): void;
  /** Marks on the globe the region or the point the open analysis covers; null removes the mark. */
  setAnalysisArea?(area: AnalysisArea | null): void;
  /** Real-time 3D user location marker on the Earth surface. */
  setUserLocation?(coords: GlobeLocation | null): void;
  setLocationSelectHandler(handler: ((location: GlobeLocation) => void) | null): void;
  inspectCenter(): void;
  /** Returns the camera to initial framing with a smooth transition. */
  resetCamera(): void;
  /** Shifts the planet laterally to make room for an instrument. */
  setFocusOffset(offsetPx: number, verticalOffsetPx?: number): void;
}

/** Visual scene preferences controlled by the user from the View tab. */
export interface ScenePreferences {
  autoRotate: boolean;
  starsVisible: boolean;
  gridVisible: boolean;
  atmosphereVisible: boolean;
  teleconnectionArcsVisible?: boolean;
  radarRipplesVisible?: boolean;
  satellitesVisible?: boolean;
  oceanFlowVisible?: boolean;
}
