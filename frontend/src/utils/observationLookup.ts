import type { ClimateObservation, ClimateVariable } from '../types/climate.types';

interface Location { lat: number; lng: number }
export interface NearbyObservation {
  observation: ClimateObservation;
  distanceDegrees: number;
}
const RADIANS = Math.PI / 180;

/** Distancia sobre la esfera: admite cruces del antimeridiano y longitudes en los polos. */
export function angularDistanceDegrees(a: Location, b: Location): number {
  const latA = a.lat * RADIANS;
  const latB = b.lat * RADIANS;
  const halfLat = Math.sin((latB - latA) / 2);
  const halfLng = Math.sin((b.lng - a.lng) * RADIANS / 2);
  const haversine = halfLat * halfLat + Math.cos(latA) * Math.cos(latB) * halfLng * halfLng;
  return 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine)))) / RADIANS;
}

/** Busca exclusivamente en la cobertura recibida; no genera valores para llenar huecos. */
export function findNearbyObservation(
  observations: readonly ClimateObservation[], location: Location | null,
  variable: ClimateVariable, supportRadiusDegrees: number,
): NearbyObservation | null {
  if (!Number.isFinite(supportRadiusDegrees) || supportRadiusDegrees <= 0 || supportRadiusDegrees > 180) {
    throw new RangeError('El radio de búsqueda debe estar entre 0 y 180 grados.');
  }
  if (!location || !Number.isFinite(location.lat) || Math.abs(location.lat) > 90
    || !Number.isFinite(location.lng) || Math.abs(location.lng) > 180) return null;
  let nearest: NearbyObservation | null = null;
  for (const observation of observations) {
    if (observation.variable !== variable || !Number.isFinite(observation.latitude) || Math.abs(observation.latitude) > 90
      || !Number.isFinite(observation.longitude) || Math.abs(observation.longitude) > 180) continue;
    const distanceDegrees = angularDistanceDegrees(location, { lat: observation.latitude, lng: observation.longitude });
    // El kernel del mapa de calor también tiene soporte abierto: peso cero a exactamente 4°.
    if (distanceDegrees < supportRadiusDegrees && (!nearest || distanceDegrees < nearest.distanceDegrees)) {
      nearest = { observation, distanceDegrees };
    }
  }
  return nearest;
}
