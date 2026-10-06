import {
  Color, Mesh, ShaderMaterial, SphereGeometry,
  type Texture, type Vector3,
} from 'three';
import type { GlobeInstance } from 'globe.gl';
import { GLOBE_RADIUS } from './globeConfig';
import { createEarthAtmosphere } from './earthAtmosphere';

export interface EarthEnvelope {
  /** El propietario de los assets conserva la responsabilidad de liberar esta textura. */
  setCloudTexture(texture: Texture): void;
  setAtmosphereVisible(visible: boolean): void;
  /** 1 en órbita; 0 al acercar, donde la textura 2K sería una mancha borrosa. */
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
  // Las capas sólo usan rotación y escala uniforme; el vector queda en espacio mundo.
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
  // Un pequeño término ambiental deja nubes tenues de noche, nunca blancas de día.
  vec3 radiance = cloudColor * (0.014 + 0.085 * twilight + 1.28 * daylight);
  gl_FragColor = vec4(radiance, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Capas ligeras sobre la misma escena: sin renderer, bucle o textura propios. */
export function createEarthEnvelope(
  globe: GlobeInstance,
  sunDirection: Vector3,
  quality: 'desktop' | 'mobile',
): EarthEnvelope {
  const scene = globe.scene();
  // La malla base de three-globe usa 90×45 por defecto. Igualar sus caras evita
  // que una esfera de nubes menos subdividida atraviese la superficie a esta altura.
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
  // Coincide con globeObj.rotation.y en three-globe: meridiano cero sobre +Z.
  clouds.rotation.y = -Math.PI / 2;
  clouds.visible = false;
  clouds.renderOrder = 1;
  clouds.raycast = () => {};

  // La atmósfera vive en su módulo (halo + bruma, conscientes del sol); aquí sólo se monta.
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
