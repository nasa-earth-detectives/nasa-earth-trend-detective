import {
  Color, Mesh, ShaderMaterial, SphereGeometry,
  type Texture, type Vector3,
} from 'three';
import type { GlobeInstance } from 'globe.gl';
import { GLOBE_RADIUS } from './globeConfig';
import { createEarthAtmosphere } from './earthAtmosphere';

export interface EarthEnvelope {
  /** The asset owner remains responsible for releasing this texture. */
  setCloudTexture(texture: Texture): void;
  setAtmosphereVisible(visible: boolean): void;
  /** 1 in orbit; 0 when zooming in, where the 2K texture would be a blurry smudge. */
  setCloudFade(fade: number): void;
  dispose(): void;
}

const envelopeVertexShader = /* glsl */ `
varying vec2 vSurfaceUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vSurfaceUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  // Layers only use rotation and uniform scale; vector remains in world space.
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const cloudFragmentShader = /* glsl */ `
uniform sampler2D cloudCoverage;
uniform vec3 sunDirection;
uniform vec3 cloudColor;
uniform float cloudFade;
varying vec2 vSurfaceUv;
varying vec3 vWorldNormal;

void main() {
  float coverage = texture2D(cloudCoverage, vSurfaceUv).r;
  float opacity = smoothstep(0.08, 0.95, coverage) * 0.78 * cloudFade;
  if (opacity < 0.006) discard;

  float sunCosine = dot(normalize(vWorldNormal), normalize(sunDirection));
  float daylight = max(0.0, sunCosine);
  float twilight = smoothstep(-0.09, 0.16, sunCosine);
  // A small ambient term leaves faint clouds at night, never daytime white.
  vec3 radiance = cloudColor * (0.014 + 0.085 * twilight + 1.28 * daylight);
  gl_FragColor = vec4(radiance, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Lightweight layers on the same scene: no separate renderer, loop, or texture. */
export function createEarthEnvelope(
  globe: GlobeInstance,
  sunDirection: Vector3,
  quality: 'desktop' | 'mobile',
): EarthEnvelope {
  const scene = globe.scene();
  // The base mesh of three-globe uses 90×45 by default. Matching its faces prevents
  // a less subdivided cloud sphere from clipping through the surface at this altitude.
  const cloudGeometry = new SphereGeometry(GLOBE_RADIUS * 1.0012, 90, 45);
  const cloudMaterial = new ShaderMaterial({
    name: 'earth-cloud-coverage',
    uniforms: {
      cloudCoverage: { value: null },
      sunDirection: { value: sunDirection },
      cloudColor: { value: new Color('#f1f3f2') },
      cloudFade: { value: 1 },
    },
    vertexShader: envelopeVertexShader,
    fragmentShader: cloudFragmentShader,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: true,
  });
  const clouds = new Mesh(cloudGeometry, cloudMaterial);
  clouds.name = 'earth-cloud-envelope';
  // Matches globeObj.rotation.y in three-globe: prime meridian along +Z.
  clouds.rotation.y = -Math.PI / 2;
  clouds.visible = false;
  clouds.renderOrder = 1;
  clouds.raycast = () => {};

  // Atmosphere lives in its module (halo + haze, sun-aware); here it is only mounted.
  const atmosphere = createEarthAtmosphere(sunDirection, quality === 'desktop' ? 96 : 48);
  scene.add(clouds, atmosphere.group);
  let disposed = false;
  let cloudTextureReady = false;
  const syncCloudVisibility = (): void => {
    clouds.visible = cloudTextureReady && cloudMaterial.uniforms.cloudFade.value > 0.001;
  };

  return {
    setCloudTexture(texture): void {
      if (disposed) return;
      cloudMaterial.uniforms.cloudCoverage.value = texture;
      cloudTextureReady = true;
      syncCloudVisibility();
    },
    setCloudFade(fade): void {
      if (disposed) return;
      cloudMaterial.uniforms.cloudFade.value = fade;
      syncCloudVisibility();
    },
    setAtmosphereVisible(visible): void {
      if (!disposed) atmosphere.group.visible = visible;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      scene.remove(clouds, atmosphere.group);
      cloudMaterial.uniforms.cloudCoverage.value = null;
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosphere.dispose();
    },
  };
}
