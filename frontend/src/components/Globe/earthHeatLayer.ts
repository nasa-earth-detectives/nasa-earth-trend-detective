import {
  ClampToEdgeWrapping, DataTexture, LinearFilter, Mesh, NoColorSpace,
  RepeatWrapping, ShaderMaterial, SphereGeometry,
} from 'three';
import type { GlobeInstance } from 'globe.gl';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import { acquireEarthAnalysisRoot } from './earthAnalysisRoot';
import { EARTH_HEAT_CONFIG, rasterizeEarthHeat } from './earthHeatRaster';
import type { HeatWorkerResponse } from './earthHeatWorker';

/** Mapa de valores, no KDE de densidad: Globe.gl suma pesos y aplica abs al color. */
export function createEarthHeatLayer(globe: GlobeInstance) {
  const root = acquireEarthAnalysisRoot(globe);
  const { width, height, transitionMs, opacity } = EARTH_HEAT_CONFIG;
  const createTexture = (pixels: Uint8Array): DataTexture => {
    const texture = new DataTexture(pixels, width, height);
    texture.colorSpace = NoColorSpace; // El raster almacena RGB ya lineal.
    texture.wrapS = RepeatWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.minFilter = texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  };
  const previousPixels = new Uint8Array(width * height * 4);
  const currentPixels = new Uint8Array(width * height * 4);
  const previous = createTexture(previousPixels);
  const current = createTexture(currentPixels);
  const material = new ShaderMaterial({
    name: 'earth-observation-heat-material',
    uniforms: { previousMap: { value: previous }, currentMap: { value: current },
      progress: { value: 1 }, opacity: { value: opacity } },
    vertexShader: `
      varying vec2 surfaceUv;
      void main() {
        surfaceUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D previousMap;
      uniform sampler2D currentMap;
      uniform float progress;
      uniform float opacity;
      varying vec2 surfaceUv;
      void main() {
        vec4 field = mix(texture2D(previousMap, surfaceUv), texture2D(currentMap, surfaceUv), progress);
        if (field.a < 0.004) discard;
        // Filtrar colores premultiplicados evita bordes negros en zonas sin muestras.
        gl_FragColor = vec4(field.rgb / max(field.a, 0.004), field.a * opacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: true, depthWrite: false, depthTest: true, toneMapped: false,
  });
  // Misma teselación y orientación que la Tierra; debajo de la esfera de nubes.
  const geometry = new SphereGeometry(globe.getGlobeRadius() * 1.0006, 90, 45);
  const mesh = new Mesh(geometry, material);
  mesh.name = 'earth-observation-heat';
  mesh.rotation.y = -Math.PI / 2;
  mesh.renderOrder = 0.5;
  mesh.visible = false;
  mesh.raycast = () => {}; // Conserva la selección de ubicación en la superficie.
  root.group.add(mesh);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let started = 0;
  let pending: { observations: ClimateObservation[]; variable: ClimateVariable } | null = null;
  let dirty = false;
  let revision = 0;
  let busy = false;
  let worker: Worker | null = null;
  let workerUnavailable = typeof Worker === 'undefined';
  const progress = (): number => {
    const t = reducedMotion.matches ? 1 : Math.min(1, (performance.now() - started) / transitionMs);
    return t * t * (3 - 2 * t);
  };
  const acceptRaster = (pixels: Uint8Array, id: number): void => {
    busy = false;
    if (disposed) return;
    if (id !== revision) { applyData(); return; }
    const from = previousPixels;
    const to = currentPixels;
    const blend = progress();
    for (let index = 0; index < from.length; index++) from[index] += (to[index] - from[index]) * blend;
    to.set(pixels);
    previous.needsUpdate = current.needsUpdate = true;
    material.uniforms.progress.value = reducedMotion.matches ? 1 : 0;
    started = performance.now();
    dirty = false;
  };
  const applyData = (): void => {
    if (!dirty || !pending || disposed || busy || !mesh.visible) return;
    if (workerUnavailable) {
      acceptRaster(rasterizeEarthHeat(pending.observations, pending.variable).pixels, revision);
      return;
    }
    if (!worker) {
      const fallback = (): void => {
        worker?.terminate(); worker = null; workerUnavailable = true; busy = false; applyData();
      };
      try {
        worker = new Worker(new URL('./earthHeatWorker.ts', import.meta.url), { type: 'module' });
      } catch { fallback(); return; }
      worker.onmessage = ({ data }: MessageEvent<HeatWorkerResponse>): void => {
        if (data.pixels) acceptRaster(data.pixels, data.id);
        else fallback();
      };
      worker.onerror = event => { event.preventDefault(); fallback(); };
    }
    busy = true;
    worker.postMessage({ id: revision, ...pending });
  };
  mesh.onBeforeRender = () => { material.uniforms.progress.value = progress(); };
  return {
    updateData(observations: ClimateObservation[], variable: ClimateVariable): void {
      if (disposed) return;
      pending = { observations, variable };
      revision++;
      dirty = true;
      if (mesh.visible) applyData();
    },
    setVisible(visible: boolean): void {
      if (disposed) return;
      mesh.visible = visible;
      if (visible) applyData();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      pending = null;
      worker?.terminate();
      worker = null;
      mesh.removeFromParent();
      previous.dispose();
      current.dispose();
      geometry.dispose();
      material.dispose();
      root.release();
    },
  };
}
