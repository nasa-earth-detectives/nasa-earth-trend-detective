/** Static Vite assets. Provenance and processing: docs/obsidian/earth-assets/README.md. */
const earthPath = (path: string): string => `${import.meta.env.BASE_URL}earth/${path}`;

export const EARTH_ASSETS = {
  day: {
    desktop: earthPath('day/blue-marble-july-4k.jpg'),
    mobile: earthPath('day/blue-marble-july-2k.jpg'),
  },
  dayDetail: earthPath('day/blue-marble-july-8k.jpg'),
  elevation: {
    desktop: earthPath('elevation/gebco-elevation-2k.png'),
    mobile: earthPath('elevation/gebco-elevation-1k.png'),
  },
  waterMask: {
    desktop: earthPath('masks/modis-water-2k.png'),
    mobile: earthPath('masks/modis-water-1k.png'),
  },
  night: {
    desktop: earthPath('night/black-marble-2016-4k.jpg'),
    mobile: earthPath('night/black-marble-2016-2k.jpg'),
  },
  clouds: {
    desktop: earthPath('clouds/blue-marble-clouds-2k.png'),
    mobile: earthPath('clouds/blue-marble-clouds-1k.png'),
  },
} as const;

export type EarthQuality = keyof typeof EARTH_ASSETS.day;
export type EarthSurfaceStatus = 'loading' | 'ready' | 'degraded' | 'fallback';

export const EARTH_MATERIAL_CONFIG = {
  bumpScale: 0.1,
  landRoughness: 0.92,
  // Smooth water: localized sun glint, without the diffuse patch from roughness 0.54.
  oceanRoughness: 0.12,
  waterIor: 1.333,
  // BMNG fills deep ocean with this RGB: it contains no observations there.
  sourceOceanFill: '#020514',
  // Approximate linear diffuse reflectance of the water body, not a NASA measurement.
  deepWaterReflectance: [0.003, 0.014, 0.035] as const,
  oceanFillTolerance: [0.002, 0.12] as const,
  exposure: 1.1,
  anisotropy: 4,
  fallbackColor: '#344552',
  ambientIntensity: 0.12,
  keyIntensity: 3.2,
} as const;

/** Lighting synchronized to UTC clock; timeline remains strictly climate-focused. */
export const EARTH_SOLAR_CONFIG = {
  updateIntervalMs: 1000,
  nightIntensity: 1.4,
  duskStart: 0,
  duskEnd: -0.12,
} as const;

/** Optional detail upgrade after zooming in; device memory threshold on mobile to avoid penalizing lower-end devices. */
export const EARTH_DETAIL_CONFIG = {
  maxAltitude: 1.2,
  desktop: { minTextureSize: 8192, minDeviceMemory: 8, label: '8k' },
  mobile: { minTextureSize: 4096, minDeviceMemory: 4, label: '4k' },
} as const;

/** Initial profile per mount: avoids reloading textures when opening panels or rotating mobile screens. */
export function chooseEarthQuality(width: number, maxTextureSize: number, coarsePointer: boolean): EarthQuality {
  return width < 1024 || maxTextureSize < 4096 || coarsePointer ? 'mobile' : 'desktop';
}
