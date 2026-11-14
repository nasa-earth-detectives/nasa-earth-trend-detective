import {
  Matrix4, Mesh, MeshStandardMaterial, NoColorSpace, SphereGeometry, SRGBColorSpace, TextureLoader, Vector3,
  type Scene,
} from 'three';
import { GLOBE_RADIUS } from './globeConfig';
import { lunarDirection } from './lunarPosition';

/**
 * The Moon in its real direction at this instant, textured and bumped with LRO data (CGI Moon Kit,
 * NASA SVS). The lunar phase is not manually calculated: it emerges naturally lit by the same sun as Earth.
 *
 * Illustrative: distance is compressed to 14 Earth radii (real distance is ~60) so it fits
 * within the scene sky; radius is true scale (0.273 R), appearing about 4 times larger
 * than seen from Earth. It always tidally locks the same face toward Earth.
 */
export const EARTH_MOON_CONFIG = {
  radius: GLOBE_RADIUS * (1737.4 / 6371),
  distance: GLOBE_RADIUS * 14,
} as const;

const base = import.meta.env.BASE_URL;

export function createEarthMoon(scene: Scene) {
  const loader = new TextureLoader();
  const material = new MeshStandardMaterial({ roughness: 1, metalness: 0 });
  // If a texture fails to load, material stays without it (plain gray Moon) rather than sampling
  // an empty image: keeps rendering reasonable while logging the failure to console.
  const color = loader.load(`${base}earth/moon/lroc-color-2k.jpg`, undefined, undefined, (error) => {
    console.warn('Moon texture unavailable; using fallback gray.', error);
    material.map = null;
    material.color.setScalar(0.55);
    material.needsUpdate = true;
  });
  color.colorSpace = SRGBColorSpace;
  const normal = loader.load(`${base}earth/moon/ldem-normal-1k.jpg`, undefined, undefined, (error) => {
    console.warn('Moon normal map unavailable; rendering without relief.', error);
    material.normalMap = null;
    material.needsUpdate = true;
  });
  normal.colorSpace = NoColorSpace;
  material.map = color;
  material.normalMap = normal;
  const geometry = new SphereGeometry(EARTH_MOON_CONFIG.radius, 96, 48);
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
    // In SphereGeometry, map longitude 0 (u = 0.5) lies along +X: that axis faces Earth.
    toEarth.copy(direction).negate();
    north.set(0, 1, 0).addScaledVector(toEarth, -toEarth.y).normalize();
    east.crossVectors(toEarth, north);
    moon.quaternion.setFromRotationMatrix(basis.makeBasis(toEarth, north, east));
  };
  place();
  // Moves ~0.25° per minute relative to Earth: repositioning on render is sufficient.
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
