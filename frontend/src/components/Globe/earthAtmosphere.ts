import {
  AdditiveBlending, BackSide, Color, Group, Mesh, ShaderMaterial, SphereGeometry, type Vector3,
} from 'three';
import { GLOBE_RADIUS } from './globeConfig';

/**
 * Additive atmospheric halo aware of the true sun direction (BackSide, 1.10 R): for each pixel,
 * the sight ray altitude above Earth is computed and brightness decays exponentially with that
 * altitude, matching air density. This keeps the edge as a sharp ring hugging the limb rather than
 * a flat gradient.
 *
 * A Fresnel haze on the planetary disk (sphere at 1.0016 R) was tested, but caused honeycomb moiré
 * patterns on the day side and was removed; the halo alone yields the blue rim of orbital photos.
 *
 * Details providing an orbital photo look: the terminator tints the halo orange and, in backlighting
 * (sun behind Earth), forward scattering lights up the limb.
 */
export const EARTH_ATMOSPHERE_CONFIG = {
  haloRadius: 1.1,
  /** Brightness scale height, in Earth radii. */
  scaleHeight: 0.011,
  dayColor: '#3f8cff',
  twilightColor: '#ff9a52',
  nightColor: '#1a3a7a',
  haloIntensity: 1.35,
} as const;

const vertexShader = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const haloFragmentShader = /* glsl */ `
uniform vec3 sunDirection;
uniform vec3 dayColor;
uniform vec3 twilightColor;
uniform vec3 nightColor;
uniform float planetRadius;
uniform float scaleHeight;
uniform float intensity;
varying vec3 vWorldPosition;

// pow(x, 2.0) is undefined in GLSL if x < 0, and here the base is negative on the night side.
float sq(float x) { return x * x; }

void main() {
  vec3 ray = normalize(vWorldPosition - cameraPosition);
  // Ray point closest to Earth center (center is at the origin).
  float t = max(-dot(cameraPosition, ray), 0.0);
  vec3 closest = cameraPosition + ray * t;
  float altitude = (length(closest) - planetRadius) / planetRadius;
  float density = exp(-max(altitude, 0.0) / scaleHeight);

  vec3 sun = normalize(sunDirection);
  float sunCos = dot(normalize(closest), sun);
  float day = smoothstep(-0.28, 0.35, sunCos);
  float twilight = exp(-sq((sunCos + 0.02) / 0.11));
  // Backlight: only the densest air (density²) glows when looking toward the sun, forming a thin ring.
  float forward = pow(max(dot(ray, sun), 0.0), 18.0) * density;

  vec3 color = mix(nightColor, dayColor, day);
  color = mix(color, twilightColor, twilight * 0.45);
  float glow = density * intensity * (0.22 + 0.78 * day + 1.1 * forward);
  gl_FragColor = vec4(color * glow, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createEarthAtmosphere(sunDirection: Vector3, segments: number) {
  const config = EARTH_ATMOSPHERE_CONFIG;
  const group = new Group();
  group.name = 'earth-atmosphere';

  const haloGeometry = new SphereGeometry(GLOBE_RADIUS * config.haloRadius, segments, segments / 2);
  const haloMaterial = new ShaderMaterial({
    name: 'earth-atmosphere-halo',
    uniforms: {
      sunDirection: { value: sunDirection },
      dayColor: { value: new Color(config.dayColor) },
      twilightColor: { value: new Color(config.twilightColor) },
      nightColor: { value: new Color(config.nightColor) },
      planetRadius: { value: GLOBE_RADIUS },
      scaleHeight: { value: config.scaleHeight },
      intensity: { value: config.haloIntensity },
    },
    vertexShader,
    fragmentShader: haloFragmentShader,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const halo = new Mesh(haloGeometry, haloMaterial);
  halo.renderOrder = 2;

  halo.raycast = () => {};
  group.add(halo);

  return {
    group,
    dispose(): void {
      haloGeometry.dispose();
      haloMaterial.dispose();
    },
  };
}
