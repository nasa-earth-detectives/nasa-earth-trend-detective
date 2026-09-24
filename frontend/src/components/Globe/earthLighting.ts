import { AmbientLight, DirectionalLight, Vector3 } from 'three';
import type { GlobeInstance } from 'globe.gl';
import { EARTH_MATERIAL_CONFIG, EARTH_SOLAR_CONFIG } from './earthConfig';
import { getSubsolarPoint } from './solarPosition';

/** Reloj UTC real, independiente del timeline climático y del recorrido de cámara. */
export function createEarthLighting(globe: GlobeInstance) {
  // La misma referencia llega al material, Black Marble, nubes y atmósfera.
  const sunDirection = new Vector3();
  const ambient = new AmbientLight(0xffffff, EARTH_MATERIAL_CONFIG.ambientIntensity);
  const key = new DirectionalLight(0xffffff, EARTH_MATERIAL_CONFIG.keyIntensity);
  ambient.name = 'earth-environment-fill';
  key.name = 'earth-sun';
  let disposed = false;

  const synchronize = (): void => {
    if (disposed) return;
    const { lat, lng } = getSubsolarPoint(Date.now());
    const position = globe.getCoords(lat, lng);
    sunDirection.set(position.x, position.y, position.z).normalize();
    key.position.copy(sunDirection).multiplyScalar(500);
    key.updateMatrixWorld();
  };
  synchronize();
  globe.lights([ambient, key]);

  // Un cálculo por segundo (≈0,004°), sin trabajo ni asignaciones por frame.
  // El tiempo absoluto evita deriva y recupera inmediatamente una pestaña suspendida.
  const refreshIfVisible = (): void => { if (!document.hidden) synchronize(); };
  const timer = window.setInterval(refreshIfVisible, EARTH_SOLAR_CONFIG.updateIntervalMs);
  document.addEventListener('visibilitychange', refreshIfVisible);
  window.addEventListener('pageshow', refreshIfVisible);
  window.addEventListener('focus', refreshIfVisible);

  return {
    sunDirection,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('pageshow', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
      globe.lights([]);
      ambient.dispose();
      key.dispose();
    },
  };
}
