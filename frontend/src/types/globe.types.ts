import type { ClimateObservation, ClimateVariable } from './climate.types';
import type { ObservationLayerMode } from './observationLayer.types';
import type { Teleconnection } from './teleconnection.types';

/**
 * Tipos e interfaces de la escena 3D del globo terráqueo (Globe.gl & Three.js).
 * Desacoplado para mantener useGlobeScene.ts conciso (< 170 líneas) y cumplir Regla 5.
 */

export interface GlobeLocation {
  lat: number;
  lng: number;
}

/** Superficie imperativa que la interfaz flotante usa para actuar sobre la escena. */
export interface GlobeSceneApi {
  setObservationData(data: ClimateObservation[], variable: ClimateVariable): void;
  setObservationMode(mode: ObservationLayerMode): void;
  setObservationSelection(id: string | null): void;
  setObservationSelectHandler(handler: ((observation: ClimateObservation | null) => void) | null): void;
  /** Preferencia del usuario sobre la rotación en reposo. */
  setAutoRotateEnabled(enabled: boolean): void;
  setStarsVisible(visible: boolean): void;
  setGridVisible(visible: boolean): void;
  setAtmosphereVisible(visible: boolean): void;
  setTeleconnectionArcsVisible?(visible: boolean): void;
  setRadarRipplesVisible?(visible: boolean): void;
  setSatellitesVisible?(visible: boolean): void;
  setOceanFlowVisible?(visible: boolean): void;
  /** Arcos de teleconexión y anillos en sus extremos. */
  setTeleconnections?(connections: Teleconnection[]): void;
  /** Maniobra cinemática "Ojo de Dios" hacia un punto específico de observación. */
  flyToGodsEye?(lat: number, lng: number, altitude?: number, durationMs?: number): void;
  setLocationSelectHandler(handler: ((location: GlobeLocation) => void) | null): void;
  inspectCenter(): void;
  /** Devuelve la cámara al encuadre inicial con una transición suave. */
  resetCamera(): void;
  /** Aparta el planeta lateralmente para dejar sitio a un instrumento. */
  setFocusOffset(offsetPx: number, verticalOffsetPx?: number): void;
}

/** Preferencias visuales de escena que el usuario controla desde la pestaña Vista. */
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

