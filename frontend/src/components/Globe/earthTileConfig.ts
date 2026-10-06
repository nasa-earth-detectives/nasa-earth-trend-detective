/**
 * Detalle satelital por niveles (LOD) al acercar la cámara.
 *
 * Fuentes verificadas el 2026-10-04 contra el GetCapabilities EPSG:3857 de NASA GIBS
 * y con peticiones reales: todas responden 200 con `Access-Control-Allow-Origin: *`.
 * - Blue Marble NG: mosaico sin nubes, nivel máximo 8 (≈611 m/px en el ecuador).
 * - Landsat WELD 2000: color verdadero anual, nivel máximo 12 (≈38 m/px). Sobre el
 *   océano devuelve un relleno negro puro (RGB 0,0,0 medido), que se descarta.
 * - Terrain Tiles (AWS Open Data, formato Terrarium): elevación derivada en gran parte
 *   del SRTM de NASA; sólo se usa para sombrear relieve, no para desplazar geometría.
 */
import { GLOBE_RADIUS } from './globeConfig';

const GIBS_3857 = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

export interface EarthTileSource {
  id: string;
  /** Recibe columna, fila y nivel en el esquema Web Mercator de Google Maps. */
  url: (x: number, y: number, level: number) => string;
  minLevel: number;
  maxLevel: number;
  /** Rellenos negros sin dato que deben dejar ver la capa inferior. */
  keyBlack: boolean;
  /** Imagen nocturna emisiva: se ve sólo en la cara de noche. */
  night: boolean;
  /** Pide elevación para sombrear relieve (de noche no aporta nada). */
  terrain: boolean;
  /** Se ve también de noche, oscurecida (Esri: "que funcione en toda la Tierra"). */
  allSides?: boolean;
  /**
   * Sólo las luces: el fondo azul oscuro de Black Marble se vuelve transparente para dejar ver la
   * imagen de detalle de noche. No se usa mezcla aditiva: la librería superpone varios niveles y el
   * fondo se sumaba dos y tres veces, en bandas en zigzag.
   */
  lightsOnly?: boolean;
}

export const EARTH_TILE_SOURCES = {
  blueMarble: {
    id: 'gibs-blue-marble-ng',
    url: (x, y, level) =>
      `${GIBS_3857}/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/${level}/${y}/${x}.jpeg`,
    minLevel: 0,
    maxLevel: 8,
    keyBlack: false,
    night: false,
    terrain: true,
  },
  // Misma edición 2016 que la textura nocturna de la superficie, pero a ≈611 m/px en lugar
  // de ≈9,8 km/px: las ciudades dejan de ser manchas al acercar de noche.
  nightLights: {
    id: 'gibs-viirs-black-marble-2016',
    url: (x, y, level) =>
      `${GIBS_3857}/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/${level}/${y}/${x}.png`,
    minLevel: 0,
    maxLevel: 8,
    keyBlack: false,
    night: true,
    terrain: false,
  },
  landsat: {
    id: 'gibs-landsat-weld-2000',
    url: (x, y, level) =>
      `${GIBS_3857}/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual/default/2000-12-01/GoogleMapsCompatible_Level12/${level}/${y}/${x}.jpeg`,
    minLevel: 9,
    maxLevel: 12,
    keyBlack: true,
    night: false,
    terrain: true,
  },
} satisfies Record<string, EarthTileSource>;

/**
 * Alta resolución opcional: Esri World Imagery (hasta nivel 19 ≈ 0,3 m/px: coches, barcos, casas).
 * Se activa sólo si existe VITE_ESRI_API_KEY (clave del equipo en frontend/.env, versionado;
 * frontend/.env.local la sustituye en cada máquina); sin clave
 * se queda Landsat de la NASA. Verificado el 2026-10-05 en developers.arcgis.com: plantilla
 * ibasemaps-api.../World_Imagery/MapServer/tile/{z}/{y}/{x}?token=…, CORS `*`. La clave viaja en
 * el JavaScript público: hay que restringirla por dominio en el panel de ArcGIS.
 * Sin relieve: Terrarium llega al nivel 15 y la foto ya trae sus sombras reales.
 */
const ESRI_KEY = String(import.meta.env.VITE_ESRI_API_KEY ?? '').trim();

const esriImagery = (key: string): EarthTileSource => ({
  id: 'esri-world-imagery',
  url: (x, y, level) =>
    `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}?token=${encodeURIComponent(key)}`,
  minLevel: 9,
  maxLevel: 19,
  keyBlack: false,
  night: false,
  terrain: false,
  allSides: true,
});

/** Fuente del detalle cercano y lo que cambia con ella (cámara mínima y plano cercano). */
export const EARTH_HIGH_RES = ESRI_KEY
  ? {
    provider: 'esri' as const,
    source: esriImagery(ESRI_KEY),
    /** El nivel 19 se pide por debajo de ~390 m (32/2^19 radios); 250 m deja verlo entero. */
    minAltitudeKm: 0.25,
    nearPlaneMin: 0.0004,
  }
  : {
    provider: 'nasa' as const,
    source: EARTH_TILE_SOURCES.landsat as EarthTileSource,
    minAltitudeKm: null,
    nearPlaneMin: 0.02,
  };

/** Terrarium usa el orden z/x/y, a diferencia de GIBS (z/y/x). */
export const terrainTileUrl = (x: number, y: number, level: number): string =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${level}/${x}/${y}.png`;

/**
 * Con Esri la cámara baja a 250 m: las capas no pueden flotar a 127-255 m. Como los mosaicos no
 * escriben profundidad y se dibujan por renderOrder, basta con pegarlos a 13-25 m.
 */
const TILE_LIFT = EARTH_HIGH_RES.provider === 'esri' ? 0.1 : 1;

export const EARTH_TILE_CONFIG = {
  /** Apenas sobre la superficie base (≈127-255 m; ≈13-25 m con Esri) más polygonOffset. */
  blueMarbleRadius: GLOBE_RADIUS * (1 + 0.00002 * TILE_LIFT),
  nightLightsRadius: GLOBE_RADIUS * (1 + 0.00003 * TILE_LIFT),
  landsatRadius: GLOBE_RADIUS * (1 + 0.00004 * TILE_LIFT),
  /** Brillo de las luces de ciudad; igual criterio que la emisión nocturna de la superficie. */
  nightIntensity: 1.4,
  /**
   * La librería pide el nivel n cuando la altitud baja de 8/2^n radios. Multiplicar por 4
   * adelanta dos niveles: así el mosaico iguala la densidad de píxeles de la pantalla en
   * lugar de verse borroso hasta estar muy cerca.
   */
  thresholdScale: 4,
  /** Altitud en radios: por encima de `fadeStart` la capa no se muestra ni pide mosaicos. */
  blueMarble: { fadeStart: 1.1, fadeEnd: 0.75 },
  landsat: { fadeStart: 0.075, fadeEnd: 0.045 },
  /** Las nubes son 2K: al acercar serían manchas borrosas, así que se retiran. */
  clouds: { hiddenBelow: 0.05, fullAbove: 0.45 },
  /** Exageración del sombreado de relieve. La geometría no se desplaza. */
  reliefExaggeration: 2.5,
  /** Plano cercano adaptativo: fracción de la distancia a la superficie (mínimo en EARTH_HIGH_RES). */
  nearPlane: { fraction: 0.35 },
  maxAnisotropy: 8,
  /** Antes del calor (0.5), las nubes (1) y la atmósfera (2). */
  renderOrder: { blueMarble: 0.1, nightLights: 0.15, landsat: 0.2 },
} as const;

// Esri exige "Powered by Esri" y los proveedores de datos siempre visibles mientras se muestre su capa.
export const EARTH_TILE_ATTRIBUTION = EARTH_HIGH_RES.provider === 'esri'
  ? 'Imágenes: NASA GIBS · Blue Marble NG · VIIRS Black Marble · Powered by Esri · Esri, Maxar, Earthstar Geographics, and the GIS User Community · Relieve: Terrain Tiles (SRTM)'
  : 'Imágenes: NASA GIBS · Blue Marble NG · VIIRS Black Marble · Landsat WELD 2000 · Relieve: Terrain Tiles (SRTM)';
