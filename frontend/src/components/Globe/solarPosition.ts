const DEGREES_TO_RADIANS = Math.PI / 180;
const DAY_MS = 86_400_000;
const J2000_UNIX_MS = 946_728_000_000;
const MAX_DATE_MS = 8_640_000_000_000_000;

export interface SubsolarPoint {
  /** Degrees north of the equator. */
  lat: number;
  /** Degrees east of Greenwich, in [-180, 180). */
  lng: number;
}

function wrapDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Subsolar coordinates from an absolute Unix timestamp (UTC milliseconds).
 * USNO solar coordinates and Greenwich mean sidereal time, with UTC ≈ UT1.
 * Intended for globe illumination, approximately 1800–2200, not navigation.
 * https://aa.usno.navy.mil/faq/sun_approx
 * https://aa.usno.navy.mil/faq/GAST
 */
export function getSubsolarPoint(timestampMs: number): SubsolarPoint {
  if (!Number.isFinite(timestampMs) || Math.abs(timestampMs) > MAX_DATE_MS) {
    throw new RangeError('Solar position requires a valid UTC timestamp in milliseconds.');
  }

  const daysSinceJ2000 = (timestampMs - J2000_UNIX_MS) / DAY_MS;
  const meanAnomaly = wrapDegrees(357.529 + 0.98560028 * daysSinceJ2000) * DEGREES_TO_RADIANS;
  const meanLongitude = wrapDegrees(280.459 + 0.98564736 * daysSinceJ2000);
  const eclipticLongitude = (meanLongitude
    + 1.915 * Math.sin(meanAnomaly)
    + 0.020 * Math.sin(2 * meanAnomaly)) * DEGREES_TO_RADIANS;
  const obliquity = (23.439 - 0.00000036 * daysSinceJ2000) * DEGREES_TO_RADIANS;
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  ) / DEGREES_TO_RADIANS;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) / DEGREES_TO_RADIANS;

  // J2000 is noon; isolate UTC midnight and hours since midnight for USNO GMST.
  const daysAtMidnight = Math.floor(daysSinceJ2000 + 0.5) - 0.5;
  const hoursSinceMidnight = (daysSinceJ2000 - daysAtMidnight) * 24;
  const centuries = daysSinceJ2000 / 36_525;
  const greenwichSiderealDegrees = 15 * (
    6.697375
    + 0.065709824279 * daysAtMidnight
    + 1.0027379 * hoursSinceMidnight
    + 0.0000258 * centuries * centuries
  );

  return {
    lat: declination,
    lng: wrapDegrees(rightAscension - greenwichSiderealDegrees + 180) - 180,
  };
}
