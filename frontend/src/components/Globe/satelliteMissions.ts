/**
 * Missions whose datasets are used by the platform, with nominal orbital parameters published by NASA
 * (Terra, Aqua, OCO-2, and GRACE-FO mission pages). Illustrative aspects are noted here:
 *
 * - Altitude is exaggerated (EARTH_SATELLITE_CONFIG.altitudeExaggeration) to make orbits visible;
 *   at true scale 705 km is only 11% of radius and satellites would graze the surface.
 * - Time is accelerated (timeScale): a real orbit takes ~99 min.
 * - 3D models: Terra, Aqua, OCO-2, and GRACE (NASA-3D-Resources), with procedural fallbacks.
 * - Terra, Aqua, and OCO-2 are sun-synchronous: their orbit planes align with local equator-crossing
 *   time relative to the scene's true sun. GRACE-FO is non-sun-synchronous; its node is illustrative.
 */
export interface SatelliteMission {
  id: string;
  name: string;
  altitudeKm: number;
  inclinationDeg: number;
  periodMin: number;
  /** Local solar time of ascending node (sun-synchronous); null = illustrative node. */
  ascendingNodeLocalTime: number | null;
  /** Node offset relative to subsolar longitude when non-sun-synchronous, in degrees. */
  illustrativeNodeOffsetDeg?: number;
  /** Initial orbital phase (radians): staggers satellite positions. */
  phase: number;
  accent: string;
  /** Half-width of rendered ground swath, in Earth radii (approximate). */
  swathHalfWidth: number;
  /** Official NASA-3D-Resources model in public/models/satellites/. */
  model: 'terra' | 'aqua' | 'oco2' | 'grace';
}

export const SATELLITE_MISSIONS: SatelliteMission[] = [
  // Terra: descending node 10:30 → ascending node 22:30. MODIS swath 2,330 km.
  { id: 'terra', name: 'Terra · MODIS', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.9,
    ascendingNodeLocalTime: 22.5, phase: 0.4, accent: '#4ade80', swathHalfWidth: 0.11, model: 'terra' },
  { id: 'aqua', name: 'Aqua · MODIS', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.8,
    ascendingNodeLocalTime: 13.5, phase: 2.2, accent: '#22d3ee', swathHalfWidth: 0.11, model: 'aqua' },
  { id: 'oco2', name: 'OCO-2 · CO₂', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.8,
    ascendingNodeLocalTime: 13.6, phase: 3.6, accent: '#fb923c', swathHalfWidth: 0.05, model: 'oco2' },
  // Rendered with the GRACE (2002-2017) model, its near-identical predecessor: NASA does not publish a GRACE-FO 3D model.
  { id: 'grace-fo', name: 'GRACE-FO · water mass', altitudeKm: 490, inclinationDeg: 89, periodMin: 94.5,
    ascendingNodeLocalTime: null, illustrativeNodeOffsetDeg: 75, phase: 5.1, accent: '#e879f9', swathHalfWidth: 0.07,
    model: 'grace' },
];

export const EARTH_SATELLITE_CONFIG = {
  altitudeExaggeration: 3,
  /** 90× => one orbit in just over one minute. */
  timeScale: 90,
  /** Scale of procedural fallback satellite (while loading model or if load fails). */
  modelScale: 3.2,
  /** Maximum dimension of NASA model in scene units (Earth radius = 100). */
  gltfSize: 24,
  orbitDots: 240,
  trailDegrees: 28,
} as const;
