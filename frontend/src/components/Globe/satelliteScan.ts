import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, ConeGeometry, DoubleSide, Line,
  LineBasicMaterial, Mesh, MeshBasicMaterial, Points, PointsMaterial, RingGeometry, ShaderMaterial, SRGBColorSpace,
} from 'three';

/**
 * Piezas translúcidas de cada satélite: cono de escaneo hacia el nadir con bandas que bajan, huella
 * en la superficie, órbita punteada y estela. Todas aditivas y sin escribir profundidad: brillan
 * sobre la escena pero la Tierra las sigue tapando cuando quedan detrás.
 */
const coneVertexShader = /* glsl */ `
varying float vHeight;
varying vec3 vViewNormal;
void main() {
  // ConeGeometry: uv.y = 1 en el vértice (satélite), 0 en la base (suelo).
  vHeight = 1.0 - uv.y;
  vViewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const coneFragmentShader = /* glsl */ `
uniform vec3 accent;
uniform float time;
uniform float fade;
varying float vHeight;
varying vec3 vViewNormal;
void main() {
  float edge = pow(1.0 - abs(vViewNormal.z), 1.4);
  float bands = 0.5 + 0.5 * sin(vHeight * 38.0 - time * 5.0);
  float alpha = (0.03 + 0.2 * vHeight * vHeight) * (0.45 + 0.55 * edge) * (0.7 + 0.3 * bands) * fade;
  gl_FragColor = vec4(accent * alpha, 1.0);
}
`;

let dotTexture: CanvasTexture | null = null;
let dotUsers = 0;

function acquireDotTexture(): CanvasTexture {
  dotUsers += 1;
  if (dotTexture) return dotTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(8, 8, 6, 0, Math.PI * 2);
    context.fill();
  }
  dotTexture = new CanvasTexture(canvas);
  dotTexture.colorSpace = SRGBColorSpace;
  return dotTexture;
}

function releaseDotTexture(): void {
  dotUsers -= 1;
  if (dotUsers === 0 && dotTexture) {
    dotTexture.dispose();
    dotTexture = null;
  }
}

/** Círculo inclinado en el marco local del plano orbital (nodo = +Z, este = +X, polo = +Y). */
export function orbitPoint(radius: number, inclination: number, u: number, target: Float32Array, offset: number): void {
  target[offset] = radius * Math.sin(u) * Math.cos(inclination);
  target[offset + 1] = radius * Math.sin(u) * Math.sin(inclination);
  target[offset + 2] = radius * Math.cos(u);
}

export function createSatelliteScan(accent: string, orbitRadius: number, inclination: number, dots: number,
  trailSegments: number) {
  const color = new Color(accent);
  const coneGeometry = new ConeGeometry(1, 1, 40, 1, true);
  const coneMaterial = new ShaderMaterial({
    uniforms: { accent: { value: color }, time: { value: 0 }, fade: { value: 1 } },
    vertexShader: coneVertexShader,
    fragmentShader: coneFragmentShader,
    side: DoubleSide, blending: AdditiveBlending, transparent: true, depthWrite: false,
  });
  const cone = new Mesh(coneGeometry, coneMaterial);

  const footprintGeometry = new RingGeometry(0.88, 1, 64);
  footprintGeometry.rotateX(-Math.PI / 2);
  const footprintMaterial = new MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: DoubleSide,
    blending: AdditiveBlending, depthWrite: false });
  const footprint = new Mesh(footprintGeometry, footprintMaterial);

  const orbitPositions = new Float32Array(dots * 3);
  for (let i = 0; i < dots; i += 1) orbitPoint(orbitRadius, inclination, (i / dots) * Math.PI * 2, orbitPositions, i * 3);
  const orbitGeometry = new BufferGeometry();
  orbitGeometry.setAttribute('position', new BufferAttribute(orbitPositions, 3));
  const orbitMaterial = new PointsMaterial({ color, size: 2.4, sizeAttenuation: false, map: acquireDotTexture(),
    transparent: true, opacity: 0.6, depthWrite: false, alphaTest: 0.2 });
  const orbit = new Points(orbitGeometry, orbitMaterial);

  // Estela: degradado a negro con mezcla aditiva = se desvanece hacia atrás sin canal alfa por vértice.
  const trailPositions = new Float32Array((trailSegments + 1) * 3);
  const trailColors = new Float32Array((trailSegments + 1) * 3);
  for (let i = 0; i <= trailSegments; i += 1) {
    const fade = (i / trailSegments) ** 1.6;
    trailColors.set([color.r * fade, color.g * fade, color.b * fade], i * 3);
  }
  const trailGeometry = new BufferGeometry();
  trailGeometry.setAttribute('position', new BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute('color', new BufferAttribute(trailColors, 3));
  const trailMaterial = new LineBasicMaterial({ vertexColors: true, blending: AdditiveBlending,
    transparent: true, depthWrite: false });
  const trail = new Line(trailGeometry, trailMaterial);
  trail.frustumCulled = false;

  for (const object of [cone, footprint, orbit, trail]) object.raycast = () => {};

  return {
    cone, footprint, orbit, trail,
    coneMaterial, footprintMaterial,
    updateTrail(u: number, trailRadians: number): void {
      for (let i = 0; i <= trailSegments; i += 1) {
        orbitPoint(orbitRadius, inclination, u - trailRadians * (1 - i / trailSegments), trailPositions, i * 3);
      }
      trailGeometry.attributes.position.needsUpdate = true;
    },
    dispose(): void {
      coneGeometry.dispose(); coneMaterial.dispose();
      footprintGeometry.dispose(); footprintMaterial.dispose();
      orbitGeometry.dispose(); orbitMaterial.dispose(); releaseDotTexture();
      trailGeometry.dispose(); trailMaterial.dispose();
    },
  };
}
