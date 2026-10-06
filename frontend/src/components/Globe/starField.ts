/**
 * Cielo de fondo: estrellas en capas (una draw call cada una) + Vía Láctea horneada.
 *
 * - Generador con semilla: el cielo es el mismo en cada carga, no un ruido nuevo.
 * - Colores por temperatura estelar (de azul a anaranjado) en proporciones aproximadas.
 * - Una capa extra se concentra en el plano galáctico para dar textura de nubes de estrellas.
 * - El grupo gira con el tiempo sidéreo real (GMST): como el sol ya es real, la Vía Láctea queda
 *   donde está de verdad respecto a la Tierra en este instante.
 */
import {
  BufferAttribute, BufferGeometry, CanvasTexture, Group, Points, PointsMaterial, SRGBColorSpace, Vector3,
  type Object3D, type Scene, type WebGLRenderer,
} from 'three';
import { GLOBE_CONFIG, type StarLayerConfig } from './globeConfig';
import { createMilkyWay, GALACTIC_CENTER, GALACTIC_EAST, GALACTIC_NORTH } from './milkyWay';

const SPECTRAL_COLORS: Array<[number, [number, number, number]]> = [
  [0.03, [0.62, 0.72, 1.0]], [0.15, [0.8, 0.86, 1.0]], [0.35, [0.97, 0.97, 1.0]],
  [0.6, [1.0, 0.95, 0.85]], [0.85, [1.0, 0.83, 0.62]], [1.0, [1.0, 0.7, 0.48]],
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-9))) * Math.cos(2 * Math.PI * random());
}

/** Disco suave: las estrellas dejan de ser cuadrados de 2 px. */
function createStarSprite(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createStarLayer(layer: StarLayerConfig, random: () => number, sprite: CanvasTexture,
  direction: () => Vector3): Points {
  const positions = new Float32Array(layer.count * 3);
  const colors = new Float32Array(layer.count * 3);
  const { starInnerRadius: inner, starOuterRadius: outer } = GLOBE_CONFIG;
  for (let i = 0; i < layer.count; i += 1) {
    const point = direction().multiplyScalar(inner + random() * (outer - inner));
    positions.set([point.x, point.y, point.z], i * 3);
    const pick = random();
    const [, rgb] = SPECTRAL_COLORS.find(([limit]) => pick <= limit) ?? SPECTRAL_COLORS[2];
    const brightness = layer.minBrightness + random() ** 2 * (1 - layer.minBrightness);
    colors.set([rgb[0] * brightness, rgb[1] * brightness, rgb[2] * brightness], i * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  const material = new PointsMaterial({
    size: layer.size,
    map: sprite,
    // Tamaño constante en píxeles: el campo estelar no debe "crecer" al hacer zoom.
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: layer.opacity,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const points = new Points(geometry, material);
  points.name = 'nasa-star-field-layer';
  points.frustumCulled = false;
  points.renderOrder = -1;
  return points;
}

/** Tiempo sidéreo medio de Greenwich, en radianes. */
export function greenwichSiderealAngle(timeMs: number): number {
  const julianDays = timeMs / 86_400_000 + 2440587.5 - 2451545.0;
  return ((((280.46061837 + 360.98564736629 * julianDays) % 360) + 360) % 360) * Math.PI / 180;
}

/** Crea el cielo y lo añade a la escena. Devuelve un único grupo para el interruptor "estrellas". */
export function createStarField(scene: Scene, renderer: WebGLRenderer): Object3D[] {
  const random = mulberry32(20261004);
  const sprite = createStarSprite();
  const sky = new Group();
  sky.name = 'nasa-sky';
  const uniform = (): Vector3 => {
    const cosPhi = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
    return new Vector3(sinPhi * Math.cos(theta), cosPhi, sinPhi * Math.sin(theta));
  };
  const galactic = (): Vector3 => {
    const l = random() * Math.PI * 2;
    const b = gaussian(random) * 0.13;
    return new Vector3().addScaledVector(GALACTIC_CENTER, Math.cos(b) * Math.cos(l))
      .addScaledVector(GALACTIC_EAST, Math.cos(b) * Math.sin(l)).addScaledVector(GALACTIC_NORTH, Math.sin(b));
  };
  for (const layer of GLOBE_CONFIG.starLayers) sky.add(createStarLayer(layer, random, sprite, uniform));
  sky.add(createStarLayer(GLOBE_CONFIG.galacticStarLayer, random, sprite, galactic));

  const milkyWay = createMilkyWay(renderer, GLOBE_CONFIG.starInnerRadius * 0.95,
    GLOBE_CONFIG.milkyWayBrightness, window.matchMedia('(pointer: coarse)').matches ? 1024 : 2048);
  // Sin temporizadores: se actualiza sólo cuando el cielo se dibuja (≈0,004° por segundo).
  milkyWay.mesh.onBeforeRender = () => { sky.rotation.y = -greenwichSiderealAngle(Date.now()); };
  sky.add(milkyWay.mesh);
  sky.userData.dispose = () => { milkyWay.dispose(); sprite.dispose(); };
  scene.add(sky);
  return [sky];
}

/** Retira el cielo de la escena y libera geometrías, materiales y texturas. */
export function disposeStarField(scene: Scene, layers: Object3D[]): void {
  for (const layer of layers) {
    scene.remove(layer);
    layer.traverse((child) => {
      if (child instanceof Points) {
        child.geometry.dispose();
        (child.material as PointsMaterial).dispose();
      }
    });
    (layer.userData.dispose as (() => void) | undefined)?.();
  }
}
