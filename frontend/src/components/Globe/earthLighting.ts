import { AmbientLight, DirectionalLight, Vector3 } from 'three';
import type { GlobeInstance } from 'globe.gl';
import { EARTH_MATERIAL_CONFIG } from './earthConfig';

/** Iluminación diurna de presentación. Phase 3 sustituirá esto por iluminación solar. */
export function createEarthLighting(globe: GlobeInstance): () => void {
  const ambient = new AmbientLight(0xffffff, EARTH_MATERIAL_CONFIG.ambientIntensity);
  const key = new DirectionalLight(0xffffff, EARTH_MATERIAL_CONFIG.keyIntensity);
  const localDirection = new Vector3(...EARTH_MATERIAL_CONFIG.keyDirection).normalize();
  const camera = globe.camera();
  const controls = globe.controls();
  const updateDirection = (): void => {
    key.position.copy(localDirection).applyQuaternion(camera.quaternion).multiplyScalar(500);
  };
  ambient.name = 'earth-presentation-ambient';
  key.name = 'earth-presentation-key';
  globe.lights([ambient, key]);
  updateDirection();
  controls.addEventListener('change', updateDirection);
  return () => {
    controls.removeEventListener('change', updateDirection);
    globe.lights([]);
    ambient.dispose();
    key.dispose();
  };
}
