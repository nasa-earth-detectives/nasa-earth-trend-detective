import {
  AdditiveBlending, BackSide, BufferGeometry, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter,
  Mesh, MeshBasicMaterial, OrthographicCamera, Scene, ShaderMaterial, SphereGeometry, Vector3,
  WebGLRenderTarget, type WebGLRenderer,
} from 'three';

const DEG = Math.PI / 180;

/** Dirección de (ascensión recta, declinación) en el marco de getCoords de three-globe con GMST = 0. */
export function celestialDirection(raDeg: number, decDeg: number): Vector3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  return new Vector3(Math.cos(dec) * Math.sin(ra), Math.sin(dec), Math.cos(dec) * Math.cos(ra));
}

/** Polo norte y centro galácticos (J2000); l = 90° (Cygnus) = N × C en este marco (comprobado). */
export const GALACTIC_NORTH = celestialDirection(192.85948, 27.12825);
export const GALACTIC_CENTER = celestialDirection(266.405, -28.93617);
export const GALACTIC_EAST = new Vector3().crossVectors(GALACTIC_NORTH, GALACTIC_CENTER).normalize();

/**
 * Banda procedural: no es un mapa del cielo, sí su geometría real (plano y centro galácticos) con
 * bulbo más ancho y brillante hacia Sagitario, nubes de estrellas y franjas de polvo oscuro.
 * Se hornea una vez a una textura equirectangular con el mismo mapeo UV que SphereGeometry.
 */
const bakeFragmentShader = /* glsl */ `
precision highp float;
uniform vec3 galNorth;
uniform vec3 galCenter;
uniform vec3 galEast;
varying vec2 vUv;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
// pow(x, 2.0) es indefinido en GLSL si x < 0, y la latitud y la longitud galácticas son negativas en
// medio cielo.
float sq(float x) { return x * x; }

void main() {
  // Mismo mapeo que SphereGeometry: u = phi / 2π, v = 1 - theta / π.
  float phi = vUv.x * 6.2831853;
  float theta = (1.0 - vUv.y) * 3.1415927;
  vec3 d = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
  float b = asin(clamp(dot(d, galNorth), -1.0, 1.0));
  float l = atan(dot(d, galEast), dot(d, galCenter));

  float coreWeight = exp(-sq(l / 0.75));
  float width = 0.11 + 0.10 * coreWeight;
  float band = exp(-sq(b / width));
  float clouds = fbm(d * 5.0 + 1.7);
  float fine = fbm(d * 22.0);
  float bulge = exp(-sq(l / 0.45) - sq(b / 0.16));
  float dust = smoothstep(0.42, 0.72, fbm(d * 11.0 + 7.3)) * exp(-sq((b + 0.012) / 0.045));

  float intensity = band * (0.15 + 0.85 * clouds) * (0.5 + 0.5 * fine) * (0.4 + 0.6 * coreWeight)
    + bulge * 0.55 * (0.5 + 0.5 * clouds);
  intensity *= 1.0 - 0.85 * dust;
  // Contraste: sin él la banda es una niebla uniforme; con él aparecen nubes y huecos.
  intensity = pow(intensity, 1.6);
  vec3 cool = vec3(0.66, 0.74, 0.95);
  vec3 warm = vec3(1.0, 0.9, 0.78);
  vec3 color = mix(cool, warm, clamp(coreWeight * 0.6 + bulge, 0.0, 1.0)) * intensity;
  gl_FragColor = vec4(color, 1.0);
}
`;

function bakeTexture(renderer: WebGLRenderer, width: number): WebGLRenderTarget {
  const target = new WebGLRenderTarget(width, width / 2, {
    generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, depthBuffer: false,
  });
  const quad = new BufferGeometry();
  quad.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  quad.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const material = new ShaderMaterial({
    uniforms: { galNorth: { value: GALACTIC_NORTH }, galCenter: { value: GALACTIC_CENTER }, galEast: { value: GALACTIC_EAST } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: bakeFragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  const scene = new Scene();
  scene.add(new Mesh(quad, material));
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, new OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(previous);
  quad.dispose();
  material.dispose();
  return target;
}

/** Esfera de fondo con la banda horneada. `brightness` escala su aporte sobre el negro del espacio. */
export function createMilkyWay(renderer: WebGLRenderer, radius: number, brightness: number, textureWidth: number) {
  const target = bakeTexture(renderer, textureWidth);
  const geometry = new SphereGeometry(radius, 64, 32);
  const material = new MeshBasicMaterial({
    map: target.texture,
    color: 0xffffff,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    opacity: brightness,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'nasa-milky-way';
  mesh.frustumCulled = false;
  mesh.renderOrder = -2;
  mesh.raycast = () => {};
  return {
    mesh,
    dispose(): void {
      geometry.dispose();
      material.dispose();
      target.dispose();
    },
  };
}
