import {
  AdditiveBlending, BackSide, Color, Group, Mesh, ShaderMaterial, SphereGeometry, type Vector3,
} from 'three';
import { GLOBE_RADIUS } from './globeConfig';

/**
 * Halo atmosférico aditivo y consciente del sol real (BackSide, 1,10 R): para cada píxel se calcula
 * a qué altura pasa el rayo de visión sobre la Tierra y el brillo cae exponencialmente con esa
 * altura, como la densidad del aire. Así el borde es un anillo nítido pegado al limbo y no un
 * degradado plano.
 *
 * Se probó además una bruma Fresnel sobre el disco (esfera a 1,0016 R): producía un muaré en panal
 * de abeja sobre el lado de día y se retiró; el halo solo da el borde azul de las fotos orbitales.
 *
 * Detalles que dan el aspecto de foto orbital: el terminador tiñe el halo de naranja y, a contraluz
 * (sol detrás de la Tierra), la dispersión hacia delante enciende el limbo.
 */
export const EARTH_ATMOSPHERE_CONFIG = {
  haloRadius: 1.1,
  /** Altura de escala del brillo, en radios terrestres. */
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

void main() {
  vec3 ray = normalize(vWorldPosition - cameraPosition);
  // Punto del rayo más cercano al centro de la Tierra (el centro está en el origen).
  float t = max(-dot(cameraPosition, ray), 0.0);
  vec3 closest = cameraPosition + ray * t;
  float altitude = (length(closest) - planetRadius) / planetRadius;
  float density = exp(-max(altitude, 0.0) / scaleHeight);

  vec3 sun = normalize(sunDirection);
  float sunCos = dot(normalize(closest), sun);
  float day = smoothstep(-0.28, 0.35, sunCos);
  float twilight = exp(-pow((sunCos + 0.02) / 0.11, 2.0));
  // Contraluz: sólo el aire más denso (density²) brilla al mirar hacia el sol, como un anillo fino.
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
