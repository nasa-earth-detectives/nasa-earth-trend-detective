/** Assets estáticos de Vite. Procedencia y procesamiento: docs/obsidian/earth-assets/README.md. */
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
  // Agua lisa: reflejo solar localizado, sin el parche difuso de roughness 0.54.
  oceanRoughness: 0.12,
  waterIor: 1.333,
  // BMNG rellena el océano profundo con este RGB: no contiene observaciones allí.
  sourceOceanFill: '#020514',
  // Reflectancia difusa lineal aproximada del cuerpo de agua, no un dato NASA.
  deepWaterReflectance: [0.003, 0.014, 0.035] as const,
  oceanFillTolerance: [0.002, 0.12] as const,
  exposure: 1.1,
  anisotropy: 4,
  fallbackColor: '#344552',
  ambientIntensity: 0.12,
  keyIntensity: 3.2,
} as const;

/** Luz sincronizada al reloj UTC; el timeline sigue siendo exclusivamente climático. */
export const EARTH_SOLAR_CONFIG = {
  updateIntervalMs: 1000,
  nightIntensity: 1.4,
  duskStart: 0,
  duskEnd: -0.12,
} as const;

/** Mejora opcional tras acercar; memoria conocida en móvil para no penalizar equipos modestos. */
export const EARTH_DETAIL_CONFIG = {
  maxAltitude: 1.2,
  desktop: { minTextureSize: 8192, minDeviceMemory: 8, label: '8k' },
  mobile: { minTextureSize: 4096, minDeviceMemory: 4, label: '4k' },
} as const;

/** Perfil inicial por montaje: no recarga texturas al abrir paneles o rotar el móvil. */
export function chooseEarthQuality(width: number, maxTextureSize: number, coarsePointer: boolean): EarthQuality {
  return width < 1024 || maxTextureSize < 4096 || coarsePointer ? 'mobile' : 'desktop';
}
