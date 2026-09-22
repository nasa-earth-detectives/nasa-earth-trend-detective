/**
 * Configuración centralizada de la escena WebGL del globo terráqueo.
 * Parte 1 (S1-T4): cimientos de escena, cámara, controles y campo estelar.
 *
 * Todas las constantes de ajuste viven aquí para evitar números mágicos
 * dispersos por los módulos de renderizado.
 */

/** Radio interno del globo en unidades de escena (three-globe usa 100). */
export const GLOBE_RADIUS = 100;

export interface StarLayerConfig {
  /** Número de estrellas de la capa (una sola draw call por capa). */
  count: number;
  /** Tamaño en píxeles (sizeAttenuation desactivado). */
  size: number;
  /** Opacidad base de la capa. */
  opacity: number;
  /** Brillo mínimo por estrella; el resto se distribuye aleatoriamente. */
  minBrightness: number;
}

export const GLOBE_CONFIG = {
  // ─── Cámara ────────────────────────────────────────────────────────────
  /**
   * Altitud inicial en múltiplos del radio del globo (paneles apaisados).
   * Calibrada para que el planeta domine el viewport sin tocar los bordes.
   */
  initialAltitude: 2.2,
  wideInitialAltitude: 2.1,
  /**
   * Relación de aspecto a partir de la cual no hace falta alejar la cámara.
   * Por debajo de este valor el planeta se saldría por los lados, porque el
   * encuadre de Globe.gl se rige por el campo de visión vertical.
   */
  referenceAspect: 1.4,
  /** Tope de alejamiento en paneles estrechos o verticales (móvil en vertical). */
  maxInitialAltitude: 6,
  /** Relación de aspecto mínima considerada: por debajo no se sigue alejando. */
  minAspect: 0.42,
  initialLat: 18,
  initialLng: -12,
  /** Distancia mínima de órbita: impide entrar dentro del planeta. */
  minDistance: GLOBE_RADIUS * 1.5,
  /** Distancia de recorte: da precisión de profundidad a la capa de nubes (R + 0.12). */
  nearPlane: 1,
  /**
   * Distancia máxima de órbita: impide que la Tierra se vuelva irrelevante.
   * Debe superar la distancia inicial más lejana (`maxInitialAltitude`).
   */
  maxDistance: GLOBE_RADIUS * 8.5,
  /** Tope de densidad de píxeles para no saturar pantallas 4K/Retina. */
  maxPixelRatio: 2,

  // ─── Rotación e interacción ────────────────────────────────────────────
  /** Velocidad de rotación en reposo: lenta y sobria. */
  autoRotateSpeed: 0.12,
  /** Amortiguación de los controles orbitales. */
  dampingFactor: 0.08,
  /** Tiempo sin interacción antes de reanudar la rotación en reposo. */
  idleResumeMs: 2600,
  /** Sensibilidad de la rueda de zoom. */
  zoomSpeed: 0.7,
  rotateSpeed: 0.55,
  /** Duración de la transición al recentrar la cámara desde la barra flotante. */
  resetCameraMs: 800,
  /** Desplazamiento compositivo temporal, independiente de la tasa de refresco. */
  focusOffsetMs: 420,

  // ─── Entorno; material y assets centralizados en earthConfig ────────────
  backgroundColor: '#05070a',
  atmosphereColor: '#94aec8',
  atmosphereAltitude: 0.045,

  // ─── Campo estelar ─────────────────────────────────────────────────────
  /** Cascarón esférico donde se distribuyen las estrellas. */
  starInnerRadius: GLOBE_RADIUS * 16,
  starOuterRadius: GLOBE_RADIUS * 26,
  /** Matiz azulado sutil (HSL) para evitar estrellas de blanco plano. */
  starHue: 0.58,
  starHueSpread: 0.08,
  starSaturation: 0.22,
  /**
   * Dos capas => variación de tamaño con solo 2 draw calls,
   * sin recurrir a shaders personalizados ni a miles de Mesh.
   */
  starLayers: [
    { count: 1400, size: 1.1, opacity: 0.75, minBrightness: 0.35 },
    { count: 220, size: 2.1, opacity: 0.9, minBrightness: 0.6 },
  ] as StarLayerConfig[],
} as const;
