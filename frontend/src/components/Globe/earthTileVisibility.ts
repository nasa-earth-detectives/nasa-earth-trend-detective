/**
 * Which side of the terminator enters the camera horizon.
 *
 * From an altitude `h` (in radii), a spherical cap of angular radius acos(1 / (1 + h)) is visible.
 * If that cap does not reach into night, the night layer does not need to render, and vice versa.
 * Using the full horizon rather than the field of view is conservative: it never hides anything
 * that is on-screen, even when lateral view panning is active.
 */
import type { Vector3 } from 'three';

const DEGREE = Math.PI / 180;
// Same bounds as shader mask: smoothstep(-0.14, 0.04, cos(angle to subsolar)).
const DAY_LIMIT = Math.acos(-0.14); // ≈ 98.0°: beyond this, no daytime pixel is visible
const NIGHT_LIMIT = Math.acos(0.04); // ≈ 87.7°: before this, no night pixel is visible
const MARGIN = 2 * DEGREE;

export function visibleTerminatorSides(
  cameraDirection: Vector3,
  sunDirection: Vector3,
  altitude: number,
): { day: boolean; night: boolean } {
  const cap = Math.acos(1 / (1 + Math.max(altitude, 0)));
  const sunLength = sunDirection.length();
  if (sunLength === 0) return { day: true, night: true };
  const cosine = Math.min(1, Math.max(-1, cameraDirection.dot(sunDirection) / sunLength));
  const fromSubsolar = Math.acos(cosine);

  return {
    day: fromSubsolar - cap < DAY_LIMIT + MARGIN,
    night: fromSubsolar + cap > NIGHT_LIMIT - MARGIN,
  };
}
