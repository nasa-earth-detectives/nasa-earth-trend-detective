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
  // Reservado: no cargar ni mezclar luz nocturna hasta disponer de dirección solar.
  night: null,
} as const;

export type EarthQuality = keyof typeof EARTH_ASSETS.day;
export type EarthSurfaceStatus = 'loading' | 'ready' | 'degraded' | 'fallback';

export const EARTH_MATERIAL_CONFIG = {
  bumpScale: 0.065,
  landRoughness: 0.92,
  oceanRoughness: 0.54,
  waterIor: 1.333,
  // BMNG rellena el océano profundo con este RGB: no contiene observaciones allí.
  sourceOceanFill: '#020514',
  // Reflectancia difusa lineal aproximada del cuerpo de agua, no un dato NASA.
  deepWaterReflectance: [0.003, 0.017, 0.042] as const,
  oceanFillTolerance: [0.002, 0.12] as const,
  exposure: 1.1,
  anisotropy: 4,
  fallbackColor: '#344552',
  // Luz de presentación relativa a la cámara; no representa fecha ni posición solar.
  ambientIntensity: 0.24,
  keyIntensity: 3.2,
  keyDirection: [-1, 0.65, 1.8] as const,
} as const;

/** Mejora opcional, sólo después de acercar la cámara; no cambia el perfil móvil. */
export const EARTH_DETAIL_CONFIG = {
  maxAltitude: 1.2,
  minTextureSize: 8192,
  minDeviceMemory: 8,
} as const;

/** Calidad decidida una vez por montaje: no recarga texturas al abrir paneles o rotar el móvil. */
export function chooseEarthQuality(width: number, maxTextureSize: number, coarsePointer: boolean): EarthQuality {
  return width < 1024 || maxTextureSize < 4096 || coarsePointer ? 'mobile' : 'desktop';
}
