/**
 * Centralized WebGL configuration for the Earth globe scene.
 * Part 1 (S1-T4): foundations of scene, camera, controls, and starfield.
 *
 * All tuning constants live here to prevent magic numbers
 * scattered across rendering modules.
 */

/** Internal globe radius in scene units (three-globe uses 100). */
export const GLOBE_RADIUS = 100;

export interface StarLayerConfig {
  /** Number of stars in the layer (single draw call per layer). */
  count: number;
  /** Size in pixels (sizeAttenuation disabled). */
  size: number;
  /** Base layer opacity. */
  opacity: number;
  /** Minimum brightness per star; remaining brightness distributes randomly. */
  minBrightness: number;
}

export const GLOBE_CONFIG = {
  // ─── Camera ────────────────────────────────────────────────────────────
  /**
   * Initial altitude in multiples of globe radius (landscape viewports).
   * Calibrated so the planet dominates the viewport without touching boundaries.
   */
  initialAltitude: 2.2,
  wideInitialAltitude: 2.1,
  /**
   * Aspect ratio above which camera pullback is unnecessary.
   * Below this value the planet would spill beyond screen borders, because
   * Globe.gl framing is governed by vertical field of view.
   */
  referenceAspect: 1.4,
  /** Pullback cap on narrow or portrait viewports (vertical mobile). */
  maxInitialAltitude: 6,
  /** Minimum aspect ratio considered: below this no further pullback occurs. */
  minAspect: 0.42,
  initialLat: 18,
  initialLng: -12,
  /**
   * Minimum distance: ≈9.6 km above surface (0.0015 radii), where Landsat WELD
   * displays its full level 12. Near plane adapts to prevent ground clipping.
   */
  minDistance: GLOBE_RADIUS * 1.0015,
  /** Near clipping plane: provides depth precision to cloud layer (R + 0.12). */
  nearPlane: 1,
  /**
   * Maximum orbital distance: prevents Earth from becoming negligible.
   * Must exceed farthest initial distance (`maxInitialAltitude`).
   */
  maxDistance: GLOBE_RADIUS * 8.5,
  /** Pixel ratio cap to prevent oversaturating 4K/Retina displays. */
  maxPixelRatio: 2,

  // ─── Rotation & Interaction ──────────────────────────────────────────
  /** Idle rotation speed: slow and restrained. */
  autoRotateSpeed: 0.12,
  /** Orbit controls damping factor. */
  dampingFactor: 0.08,
  /** Idle time before resuming rotation. */
  idleResumeMs: 2600,
  /** Zoom wheel sensitivity. */
  zoomSpeed: 0.7,
  rotateSpeed: 0.55,
  /** Transition duration when recentering camera from floating bar. */
  resetCameraMs: 800,
  /** Temporary compositional focus offset, independent of frame rate. */
  focusOffsetMs: 420,

  // ─── Environment; material and assets centralized in earthConfig ────────
  backgroundColor: '#05070a',
  atmosphereColor: '#94aec8',
  atmosphereAltitude: 0.045,

  // ─── Starfield ─────────────────────────────────────────────────────────
  /** Spherical shell where stars are distributed. */
  starInnerRadius: GLOBE_RADIUS * 16,
  starOuterRadius: GLOBE_RADIUS * 26,
  /** Subtle bluish tint (HSL) avoiding flat white stars. */
  starHue: 0.58,
  starHueSpread: 0.08,
  starSaturation: 0.22,
  /**
   * Three uniform layers (faint, medium, bright) => size variation with 3 draw calls.
   * Sizes in pixels using round sprite points, slightly larger than square points.
   */
  starLayers: [
    { count: 5200, size: 1.4, opacity: 0.7, minBrightness: 0.25 },
    { count: 1100, size: 2.2, opacity: 0.85, minBrightness: 0.45 },
    { count: 150, size: 3.6, opacity: 1, minBrightness: 0.7 },
  ] as StarLayerConfig[],
  /** Faint stars concentrated along galactic plane (Milky Way star clouds). */
  galacticStarLayer: { count: 7000, size: 1.2, opacity: 0.55, minBrightness: 0.2 } as StarLayerConfig,
  /** Contribution of baked band over deep space black (0-1). */
  milkyWayBrightness: 0.3,
} as const;
