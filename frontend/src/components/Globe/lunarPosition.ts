import type { Vector3 } from 'three';
import { greenwichSiderealAngle } from './starField';

const DEG = Math.PI / 180;
const OBLIQUITY = 23.439 * DEG;

/**
 * Posición de la Luna con una serie de baja precisión (términos principales: ecuación del centro,
 * evección, variación y ecuación anual). Comprobado contra el calendario lunar de octubre de 2026:
 * iluminación 39,5 % / 28,8 % / ~19 % el 4, 5 y 6 a las 12:00 UTC, frente a 40 % / 29 % / 20 %
 * publicados; luna nueva el 11 y llena el 26. Error del orden de pocos grados: de sobra para verla.
 */
export function lunarEclipticPosition(timeMs: number): { longitude: number; latitude: number; distanceKm: number } {
  const d = timeMs / 86_400_000 + 2440587.5 - 2451545.0;
  const L = 218.316 + 13.176396 * d;
  const M = 134.963 + 13.064993 * d;
  const F = 93.272 + 13.22935 * d;
  const E = 297.85 + 12.190749 * d;
  const sunAnomaly = 357.529 + 0.98560028 * d;
  const s = (deg: number) => Math.sin(deg * DEG);
  const longitude = L + 6.289 * s(M) + 1.274 * s(2 * E - M) + 0.658 * s(2 * E) + 0.214 * s(2 * M)
    - 0.186 * s(sunAnomaly) - 0.114 * s(2 * F);
  const latitude = 5.128 * s(F) + 0.28 * s(M + F) + 0.277 * s(M - F) + 0.173 * s(2 * E - F);
  const distanceKm = 385001 - 20905 * Math.cos(M * DEG) - 3699 * Math.cos((2 * E - M) * DEG)
    - 2956 * Math.cos(2 * E * DEG);
  return { longitude: longitude * DEG, latitude: latitude * DEG, distanceKm };
}

/** Dirección de la Luna en el marco fijo a la Tierra de la escena (el de getCoords de three-globe). */
export function lunarDirection(timeMs: number, target: Vector3): Vector3 {
  const { longitude: l, latitude: b } = lunarEclipticPosition(timeMs);
  const rightAscension = Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
  const declination = Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
  // La Tierra gira bajo el cielo: longitud terrestre = ascensión recta − tiempo sidéreo.
  const hourAngle = rightAscension - greenwichSiderealAngle(timeMs);
  return target.set(
    Math.cos(declination) * Math.sin(hourAngle),
    Math.sin(declination),
    Math.cos(declination) * Math.cos(hourAngle),
  );
}
