import {
  Matrix4, Mesh, MeshStandardMaterial, NoColorSpace, SphereGeometry, SRGBColorSpace, TextureLoader, Vector3,
  type Scene,
} from 'three';
import { GLOBE_RADIUS } from './globeConfig';
import { lunarDirection } from './lunarPosition';

/**
 * La Luna en su dirección real de este instante, con la textura y el relieve del LRO (CGI Moon Kit,
 * NASA SVS). La fase no se calcula: sale sola porque la ilumina la misma luz solar que a la Tierra.
 *
 * Ilustrativo: la distancia se comprime a 14 radios terrestres (la real es ~60) para que quepa
 * dentro del cielo de la escena; el tamaño es el real (0,273 R), así que se ve unas 4 veces mayor
 * que desde la Tierra. Siempre muestra la misma cara a la Tierra (acoplamiento de marea).
 */
export const EARTH_MOON_CONFIG = {
  radius: GLOBE_RADIUS * (1737.4 / 6371),
  distance: GLOBE_RADIUS * 14,
} as const;

const base = import.meta.env.BASE_URL;

export function createEarthMoon(scene: Scene) {
  const loader = new TextureLoader();
  const color = loader.load(`${base}earth/moon/lroc-color-2k.jpg`);
  color.colorSpace = SRGBColorSpace;
  const normal = loader.load(`${base}earth/moon/ldem-normal-1k.jpg`);
  normal.colorSpace = NoColorSpace;
  const geometry = new SphereGeometry(EARTH_MOON_CONFIG.radius, 96, 48);
  const material = new MeshStandardMaterial({ map: color, normalMap: normal, roughness: 1, metalness: 0 });
  const moon = new Mesh(geometry, material);
  moon.name = 'earth-moon';
  moon.raycast = () => {};

  const direction = new Vector3();
  const toEarth = new Vector3();
  const north = new Vector3();
  const east = new Vector3();
  const basis = new Matrix4();
  const place = (): void => {
    lunarDirection(Date.now(), direction);
    moon.position.copy(direction).multiplyScalar(EARTH_MOON_CONFIG.distance);
    // En SphereGeometry la longitud 0 del mapa (u = 0,5) queda en +X: ese eje mira a la Tierra.
    toEarth.copy(direction).negate();
    north.set(0, 1, 0).addScaledVector(toEarth, -toEarth.y).normalize();
    east.crossVectors(toEarth, north);
    moon.quaternion.setFromRotationMatrix(basis.makeBasis(toEarth, north, east));
  };
  place();
  // Se mueve ~0,25° por minuto respecto a la Tierra: basta recolocarla cuando se dibuja.
  moon.onBeforeRender = place;
  scene.add(moon);

  return {
    setVisible(visible: boolean): void {
      moon.visible = visible;
    },
    dispose(): void {
      scene.remove(moon);
      geometry.dispose();
      material.dispose();
      color.dispose();
      normal.dispose();
    },
  };
}
