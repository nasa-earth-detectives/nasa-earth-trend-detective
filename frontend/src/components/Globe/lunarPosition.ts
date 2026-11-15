import type { Vector3 } from 'three';
import { greenwichSiderealAngle } from './starField';

const DEG = Math.PI / 180;
const OBLIQUITY = 23.439 * DEG;

/**
 * Lunar position via a low-precision analytical series (principal terms: equation of the center,
 * evection, variation, and annual equation). Verified against October 2026 lunar calendar:
 * illumination 39.5% / 28.8% / ~19% on Oct 4, 5, 6 at 12:00 UTC vs 40% / 29% / 20%
 * published; new moon on Oct 11, full moon on Oct 26. Error within a few degrees: plenty for visual rendering.
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

/** Moon direction in scene's Earth-fixed frame (three-globe getCoords frame). */
export function lunarDirection(timeMs: number, target: Vector3): Vector3 {
  const { longitude: l, latitude: b } = lunarEclipticPosition(timeMs);
  const rightAscension = Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
  const declination = Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
  // Earth rotates beneath the sky: Earth longitude = right ascension − sidereal time.
  const hourAngle = rightAscension - greenwichSiderealAngle(timeMs);
  return target.set(
    Math.cos(declination) * Math.sin(hourAngle),
    Math.sin(declination),
    Math.cos(declination) * Math.cos(hourAngle),
  );
}
