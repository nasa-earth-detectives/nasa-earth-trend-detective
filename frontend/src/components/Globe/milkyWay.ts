import {
  AdditiveBlending, BackSide, BufferGeometry, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter,
  Mesh, MeshBasicMaterial, OrthographicCamera, Scene, ShaderMaterial, SphereGeometry, Vector3,
  WebGLRenderTarget, type WebGLRenderer,
} from 'three';

const DEG = Math.PI / 180;

/** Direction of (right ascension, declination) in three-globe getCoords frame with GMST = 0. */
export function celestialDirection(raDeg: number, decDeg: number): Vector3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  return new Vector3(Math.cos(dec) * Math.sin(ra), Math.sin(dec), Math.cos(dec) * Math.cos(ra));
}

/** Galactic north pole and center (J2000); l = 90° (Cygnus) = N × C in this frame (verified). */
export const GALACTIC_NORTH = celestialDirection(192.85948, 27.12825);
export const GALACTIC_CENTER = celestialDirection(266.405, -28.93617);
export const GALACTIC_EAST = new Vector3().crossVectors(GALACTIC_NORTH, GALACTIC_CENTER).normalize();

/**
 * Procedural band: not a full sky survey, but its true geometry (galactic plane and center) with
 * wider, brighter bulge toward Sagittarius, star clouds, and dark dust rifts.
 * Baked once to an equirectangular texture matching SphereGeometry UV mapping.
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
// pow(x, 2.0) is undefined in GLSL if x < 0, and galactic latitude and longitude are negative
// across half the sky.
float sq(float x) { return x * x; }

void main() {
  // Same mapping as SphereGeometry: u = phi / 2π, v = 1 - theta / π.
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
  // Contrast: without it the band is uniform fog; with it star clouds and rifts emerge.
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

/** Background sphere with the baked band. `brightness` scales its contribution over deep space black. */
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
