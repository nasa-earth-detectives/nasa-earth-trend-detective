/**
 * Missions whose data the platform uses, with nominal orbital parameters published by NASA
 * (Terra, Aqua, OCO-2, and GRACE-FO mission pages). What is illustrative is noted here:
 *
 * - Altitude is exaggerated (EARTH_SATELLITE_CONFIG.altitudeExaggeration) so orbits are visible;
 *   at true scale 705 km is 11% of the radius and satellites would graze the surface.
 * - Time is accelerated (timeScale): one real orbit takes ~99 min.
 * - The fallback 3D model is generic (gold-foil body and solar wings), not mission-specific.
 * - Terra, Aqua, and OCO-2 are sun-synchronous: their plane is oriented by local equator-crossing
 *   time relative to the scene's real sun. GRACE-FO is not; its node is illustrative.
 */
export interface SatelliteMission {
  id: string;
  name: string;
  altitudeKm: number;
  inclinationDeg: number;
  periodMin: number;
  /** Local solar time of ascending node (sun-synchronous); null = illustrative node. */
  ascendingNodeLocalTime: number | null;
  /** Node offset relative to subsolar point when not sun-synchronous, in degrees. */
  illustrativeNodeOffsetDeg?: number;
  /** Initial phase along the orbit (radians): spaces satellites apart. */
  phase: number;
  accent: string;
  /** Half of drawn swath width, in Earth radii (indicative). */
  swathHalfWidth: number;
  /** Official NASA-3D-Resources model in public/models/satellites/. */
  model: 'terra' | 'aqua' | 'oco2' | 'grace';
}

export const SATELLITE_MISSIONS: SatelliteMission[] = [
  // Terra: descending node 10:30 -> ascending 22:30. MODIS swaths 2,330 km.
  { id: 'terra', name: 'Terra · MODIS', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.9,
    ascendingNodeLocalTime: 22.5, phase: 0.4, accent: '#86a05c', swathHalfWidth: 0.11, model: 'terra' },
  { id: 'aqua', name: 'Aqua · MODIS', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.8,
    ascendingNodeLocalTime: 13.5, phase: 2.2, accent: '#9dc0d2', swathHalfWidth: 0.11, model: 'aqua' },
  { id: 'oco2', name: 'OCO-2 · CO₂', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.8,
    ascendingNodeLocalTime: 13.6, phase: 3.6, accent: '#d4834a', swathHalfWidth: 0.05, model: 'oco2' },
  // Drawn with the GRACE (2002-2017) model, its nearly identical predecessor: NASA does not publish GRACE-FO.
  { id: 'grace-fo', name: 'GRACE-FO · water mass', altitudeKm: 490, inclinationDeg: 89, periodMin: 94.5,
    ascendingNodeLocalTime: null, illustrativeNodeOffsetDeg: 75, phase: 5.1, accent: '#a38cb9', swathHalfWidth: 0.07,
    model: 'grace' },
];

export const EARTH_SATELLITE_CONFIG = {
  altitudeExaggeration: 3,
  /** 90× => one orbit in just over a minute. */
  timeScale: 90,
  /** Scale of the fallback procedural satellite (while the model loads or if it fails). */
  modelScale: 3.2,
  /** Maximum dimension of the NASA model in scene units (Earth radius = 100). */
  gltfSize: 24,
  orbitDots: 240,
  trailDegrees: 28,
} as const;
