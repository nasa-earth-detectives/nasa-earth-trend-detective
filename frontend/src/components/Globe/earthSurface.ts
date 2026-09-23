import {
  AgXToneMapping, ClampToEdgeWrapping, LinearFilter, LinearMipmapLinearFilter,
  NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader,
} from 'three';
import type { GlobeInstance } from 'globe.gl';
import { EARTH_ASSETS, EARTH_DETAIL_CONFIG, EARTH_MATERIAL_CONFIG, chooseEarthQuality, type EarthSurfaceStatus } from './earthConfig';
import { createEarthLighting } from './earthLighting';
import { createEarthMaterial } from './earthMaterial';
import { createEarthEnvelope } from './earthEnvelope';

/** Propietario del material y mapas: conserva la geometría, instancia y renderer de Globe. */
export function createEarthSurface(globe: GlobeInstance, container: HTMLElement,
  onStatus?: (status: EarthSurfaceStatus) => void) {
  const renderer = globe.renderer();
  const originalMaterial = globe.globeMaterial();
  const lighting = createEarthLighting(globe);
  const material = createEarthMaterial(lighting.sunDirection);
  globe.globeMaterial(material);
  const ownedTextures = new Set<Texture>();
  const loader = new TextureLoader();
  let disposed = false;
  const status = (value: EarthSurfaceStatus): void => {
    if (disposed) return;
    container.dataset.earthSurface = value;
    onStatus?.(value);
  };
  const quality = chooseEarthQuality(container.clientWidth, renderer.capabilities.maxTextureSize,
    window.matchMedia('(pointer: coarse)').matches);
  const envelope = createEarthEnvelope(globe, lighting.sunDirection, quality);
  globe.showAtmosphere(false);
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const detailConfig = EARTH_DETAIL_CONFIG[quality];
  const detailAsset = quality === 'desktop' ? EARTH_ASSETS.dayDetail : EARTH_ASSETS.day.desktop;
  const canLoadDetail = renderer.capabilities.maxTextureSize >= detailConfig.minTextureSize
    && (deviceMemory === undefined ? quality === 'desktop' : deviceMemory >= detailConfig.minDeviceMemory);
  const controls = globe.controls();
  let interacted = false;
  let detailRequested = false;
  container.dataset.earthQuality = quality;
  container.dataset.earthDetail = quality === 'desktop' ? '4k' : '2k';
  status('loading');
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = EARTH_MATERIAL_CONFIG.exposure;

  const load = (url: string, color: boolean): Promise<Texture | null> => new Promise(resolve => {
    const texture = loader.load(url, loaded => {
      if (disposed) { loaded.dispose(); resolve(null); return; }
      loaded.name = url;
      loaded.colorSpace = color ? SRGBColorSpace : NoColorSpace;
      loaded.wrapS = RepeatWrapping;
      loaded.wrapT = ClampToEdgeWrapping;
      loaded.flipY = true;
      loaded.minFilter = LinearMipmapLinearFilter;
      loaded.magFilter = LinearFilter;
      loaded.generateMipmaps = true;
      loaded.anisotropy = Math.min(EARTH_MATERIAL_CONFIG.anisotropy, renderer.capabilities.getMaxAnisotropy());
      loaded.needsUpdate = true;
      resolve(loaded);
    }, undefined, () => {
      texture.dispose();
      ownedTextures.delete(texture);
      resolve(null);
    });
    ownedTextures.add(texture);
  });

  const requestDetail = (): void => {
    if (disposed || !interacted || !canLoadDetail || detailRequested || !material.map
      || globe.pointOfView().altitude > EARTH_DETAIL_CONFIG.maxAltitude) return;
    detailRequested = true;
    void load(detailAsset, true).then(texture => {
      if (disposed || !texture) return; // Un fallo opcional conserva el mapa inicial y no reintenta.
      const previous = material.map;
      material.map = texture;
      container.dataset.earthDetail = detailConfig.label;
      if (previous) { ownedTextures.delete(previous); previous.dispose(); }
    });
  };
  const onInteractionEnd = (): void => { interacted = true; requestDetail(); };
  controls.addEventListener('end', onInteractionEnd);

  const day = load(EARTH_ASSETS.day[quality], true).then(texture => {
    if (disposed) return null;
    if (!texture) { status('fallback'); return null; }
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
    requestDetail();
    return texture;
  });
  const elevation = load(EARTH_ASSETS.elevation[quality], false).then(texture => {
    if (disposed) return null;
    if (texture) { material.bumpMap = texture; material.needsUpdate = true; }
    return texture;
  });
  const water = load(EARTH_ASSETS.waterMask[quality], false).then(texture => {
    if (disposed) return null;
    if (texture) {
      material.roughnessMap = texture;
      material.needsUpdate = true;
    }
    return texture;
  });
  const night = load(EARTH_ASSETS.night[quality], true).then(texture => {
    if (disposed) return null;
    if (texture) { material.emissiveMap = texture; material.needsUpdate = true; }
    container.dataset.earthNight = texture ? 'ready' : 'unavailable';
    return texture;
  });
  const clouds = load(EARTH_ASSETS.clouds[quality], false).then(texture => {
    if (disposed) return null;
    if (texture) envelope.setCloudTexture(texture);
    container.dataset.earthClouds = texture ? 'ready' : 'unavailable';
    return texture;
  });
  void Promise.all([day, elevation, water, night, clouds]).then(([dayMap, bumpMap, waterMap, nightMap, cloudMap]) => {
    status(!dayMap ? 'fallback' : bumpMap && waterMap && nightMap && cloudMap ? 'ready' : 'degraded');
  });

  const dispose = (): void => {
    disposed = true;
    controls.removeEventListener('end', onInteractionEnd);
    lighting.dispose();
    envelope.dispose();
    material.map = null;
    material.bumpMap = null;
    material.roughnessMap = null;
    material.emissiveMap = null;
    ownedTextures.forEach(texture => texture.dispose());
    ownedTextures.clear();
    globe.globeMaterial(originalMaterial);
    material.dispose();
  };
  return {
    dispose,
    setAtmosphereVisible: envelope.setAtmosphereVisible,
    setSolarMotionEnabled: lighting.setMotionEnabled,
  };
}
