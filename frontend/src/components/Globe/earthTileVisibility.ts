/**
 * Qué lado del terminador entra en el horizonte de la cámara.
 *
 * Desde una altitud `h` (en radios) se ve un casquete de radio angular acos(1 / (1 + h)).
 * Si ese casquete no alcanza la noche, la capa nocturna no necesita dibujarse, y al revés.
 * Usar el horizonte completo y no el campo de visión es conservador: nunca oculta algo
 * que esté en pantalla, aunque el desplazamiento lateral de la vista esté activo.
 */
import type { Vector3 } from 'three';

const DEGREE = Math.PI / 180;
// Mismos límites que la máscara del shader: smoothstep(-0.14, 0.04, cos(ángulo al subsolar)).
const DAY_LIMIT = Math.acos(-0.14); // ≈ 98,0°: más allá, ningún píxel diurno es visible
const NIGHT_LIMIT = Math.acos(0.04); // ≈ 87,7°: más acá, ningún píxel nocturno es visible
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
