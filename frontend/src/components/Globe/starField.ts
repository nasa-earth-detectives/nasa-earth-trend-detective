/**
 * Campo estelar de fondo para la escena del globo.
 *
 * Se implementa con BufferGeometry + Points (una draw call por capa) en lugar
 * de miles de Mesh individuales, para sostener el objetivo de 60 FPS.
 * El brillo se modula por vértice mediante `vertexColors`, evitando shaders
 * personalizados en esta fase.
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  PointsMaterial,
  type Object3D,
  type Scene,
} from 'three';
import { GLOBE_CONFIG, type StarLayerConfig } from './globeConfig';

/** Punto aleatorio uniforme dentro de un cascarón esférico (sin sesgo polar). */
function randomShellPosition(inner: number, outer: number): [number, number, number] {
  const cosPhi = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
  const radius = inner + Math.random() * (outer - inner);

  return [
    radius * sinPhi * Math.cos(theta),
    radius * cosPhi,
    radius * sinPhi * Math.sin(theta),
  ];
}

function createStarLayer(layer: StarLayerConfig): Points {
  const positions = new Float32Array(layer.count * 3);
  const colors = new Float32Array(layer.count * 3);
  const tint = new Color();

  for (let i = 0; i < layer.count; i += 1) {
    const [x, y, z] = randomShellPosition(
      GLOBE_CONFIG.starInnerRadius,
      GLOBE_CONFIG.starOuterRadius,
    );
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const brightness = layer.minBrightness + Math.random() * (1 - layer.minBrightness);
    const hue = GLOBE_CONFIG.starHue + (Math.random() - 0.5) * GLOBE_CONFIG.starHueSpread;
    tint.setHSL(hue, GLOBE_CONFIG.starSaturation, 0.5 * brightness + 0.5 * brightness * 0.6);

    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  const material = new PointsMaterial({
    size: layer.size,
    // Tamaño constante en píxeles: el campo estelar no debe "crecer" al hacer zoom.
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: layer.opacity,
    depthWrite: false,
    fog: false,
    // Conserva el brillo del fondo cuando la superficie terrestre usa tone mapping.
    toneMapped: false,
  });

  const points = new Points(geometry, material);
  points.name = 'nasa-star-field-layer';
  // El campo estelar es fondo: nunca debe recortarse por el frustum culling.
  points.frustumCulled = false;
  points.renderOrder = -1;

  return points;
}

/** Crea las capas del campo estelar y las añade a la escena indicada. */
export function createStarField(scene: Scene): Points[] {
  const layers = GLOBE_CONFIG.starLayers.map(createStarLayer);
  layers.forEach((layer) => scene.add(layer));

  return layers;
}

/** Retira las capas de la escena y libera geometrías y materiales. */
export function disposeStarField(scene: Scene, layers: Points[]): void {
  for (const layer of layers) {
    scene.remove(layer as Object3D);
    layer.geometry.dispose();

    if (Array.isArray(layer.material)) {
      layer.material.forEach((material) => material.dispose());
    } else {
      layer.material.dispose();
    }
  }
}
