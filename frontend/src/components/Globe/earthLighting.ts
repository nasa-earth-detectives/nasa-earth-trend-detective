import { AmbientLight, DirectionalLight, Vector3 } from 'three';
import type { GlobeInstance } from 'globe.gl';
import { EARTH_MATERIAL_CONFIG, EARTH_SOLAR_CONFIG } from './earthConfig';

/** Una única dirección solar terrestre, independiente de OrbitControls/cámara. */
export function createEarthLighting(globe: GlobeInstance) {
  const position = globe.getCoords(EARTH_SOLAR_CONFIG.latitude, EARTH_SOLAR_CONFIG.longitude);
  const sunDirection = new Vector3(position.x, position.y, position.z).normalize();
  const ambient = new AmbientLight(0xffffff, EARTH_MATERIAL_CONFIG.ambientIntensity);
  const key = new DirectionalLight(0xffffff, EARTH_MATERIAL_CONFIG.keyIntensity);
  ambient.name = 'earth-environment-fill';
  key.name = 'earth-sun';
  key.position.copy(sunDirection).multiplyScalar(500);
  globe.lights([ambient, key]);
  const scene = globe.scene();
  const previousBeforeRender = scene.onBeforeRender;
  const polarAxis = new Vector3(0, 1, 0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = true;
  let previousTime = performance.now();
  // La Tierra conserva sus coordenadas geográficas. El Sol avanza hacia el oeste
  // en esta referencia fija a la Tierra: mismo resultado relativo que su rotación.
  // Se usa el bucle existente; sin RAF adicional ni objetos/estado React por frame.
  const beforeRender: typeof scene.onBeforeRender = (renderer, currentScene, camera, geometry, material, group) => {
    previousBeforeRender.call(scene, renderer, currentScene, camera, geometry, material, group);
    const now = performance.now();
    const elapsed = Math.min((now - previousTime) / 1000, 0.1);
    previousTime = now;
    if (!motionEnabled || reducedMotion.matches) return;
    sunDirection.applyAxisAngle(polarAxis, -elapsed * Math.PI * 2 / EARTH_SOLAR_CONFIG.cycleSeconds);
    key.position.copy(sunDirection).multiplyScalar(500);
    // onBeforeRender ocurre después de updateMatrixWorld de la escena en r186.
    key.updateMatrixWorld();
  };
  scene.onBeforeRender = beforeRender;
  return {
    sunDirection,
    setMotionEnabled: (enabled: boolean): void => { motionEnabled = enabled; },
    dispose: () => {
      if (scene.onBeforeRender === beforeRender) scene.onBeforeRender = previousBeforeRender;
      globe.lights([]);
      ambient.dispose();
      key.dispose();
    },
  };
}
