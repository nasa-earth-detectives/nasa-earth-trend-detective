import type { ClimateObservation, ClimateVariable } from './climate.types';
import type { ObservationLayerMode } from './observationLayer.types';

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
}
