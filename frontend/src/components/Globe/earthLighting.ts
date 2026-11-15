import { AmbientLight, DirectionalLight, Vector3 } from 'three';
import type { GlobeInstance } from 'globe.gl';
import { EARTH_MATERIAL_CONFIG, EARTH_SOLAR_CONFIG } from './earthConfig';
import { getSubsolarPoint } from './solarPosition';

/** Real UTC clock, independent of the climate timeline and camera travel. */
export function createEarthLighting(globe: GlobeInstance) {
  // The same reference feeds the material, Black Marble, clouds, and atmosphere.
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

  // One calculation per second (≈0.004°), with zero work or allocations per frame.
  // Absolute time prevents drift and immediately recovers suspended tabs.
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
