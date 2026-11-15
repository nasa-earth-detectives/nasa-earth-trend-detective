/**
 * Level of Detail (LOD) satellite imagery upon camera zoom.
 *
 * Sources verified on 2026-10-04 against NASA GIBS EPSG:3857 GetCapabilities
 * and live HTTP queries: all return 200 with `Access-Control-Allow-Origin: *`.
 * - Blue Marble NG: cloudless mosaic, maximum level 8 (≈611 m/px at equator).
 * - Landsat WELD 2000: annual true color, maximum level 12 (≈38 m/px). Over
 *   oceans it returns pure black fill (measured RGB 0,0,0), which is keyed out.
 * - Terrain Tiles (AWS Open Data, Terrarium format): elevation largely derived
 *   from NASA SRTM; used only for hillshade relief, not geometry displacement.
 */
import { GLOBE_RADIUS } from './globeConfig';

const GIBS_3857 = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

export interface EarthTileSource {
  id: string;
  /** Receives column, row, and zoom level in Google Maps Web Mercator layout. */
  url: (x: number, y: number, level: number) => string;
  minLevel: number;
  maxLevel: number;
  /** Black no-data fills that must reveal underlying layers. */
  keyBlack: boolean;
  /** Emissive night imagery: rendered only on the night side. */
  night: boolean;
  /** Requests elevation to shade terrain relief (adds nothing at night). */
  terrain: boolean;
  /** Also rendered at night, darkened (Esri: "works across all of Earth"). */
  allSides?: boolean;
  /**
   * City lights only: Black Marble's dark blue background becomes transparent to reveal
   * underlying detail imagery at night. Additive blending is avoided because tile overlays
   * caused the dark background to sum multiple times in visible zigzag stripes.
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
  // Same 2016 edition as the base surface night texture, but at ≈611 m/px instead
  // of ≈9.8 km/px: city clusters no longer look pixelated when zooming in at night.
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
 * Optional high resolution: Esri World Imagery (up to level 19 ≈ 0.3 m/px: cars, ships, buildings).
 * Activated only if VITE_ESRI_API_KEY is present (configured in frontend/.env.local for development
 * or Vercel/GitHub Secrets for production); without a key it falls back to NASA Landsat.
 * Verified on 2026-10-05 at developers.arcgis.com: template
 * ibasemaps-api.../World_Imagery/MapServer/tile/{z}/{y}/{x}?token=…, CORS `*`.
 * The key travels in public client JS: restrict by domain in the ArcGIS developer dashboard.
 * Without relief: Terrarium stops at level 15 and aerial imagery already contains natural shadows.
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

/** Close-range detail source and dependent settings (minimum camera altitude and near plane). */
export const EARTH_HIGH_RES = ESRI_KEY
  ? {
    provider: 'esri' as const,
    source: esriImagery(ESRI_KEY),
    /** Level 19 is requested below ~390 m (32/2^19 radii); 250 m shows it in full resolution. */
    minAltitudeKm: 0.25,
    nearPlaneMin: 0.0004,
  }
  : {
    provider: 'nasa' as const,
    source: EARTH_TILE_SOURCES.landsat as EarthTileSource,
    minAltitudeKm: null,
    nearPlaneMin: 0.02,
  };

/** Terrarium uses z/x/y tile order, unlike GIBS (z/y/x). */
export const terrainTileUrl = (x: number, y: number, level: number): string =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${level}/${x}/${y}.png`;

/**
 * With Esri the camera drops to 250 m: layers cannot float at 127-255 m. Since tiles do not
 * write depth and are sorted by renderOrder, lifting them 13-25 m is sufficient.
 */
const TILE_LIFT = EARTH_HIGH_RES.provider === 'esri' ? 0.1 : 1;

export const EARTH_TILE_CONFIG = {
  /** Just above base surface (≈127-255 m; ≈13-25 m with Esri) plus polygonOffset. */
  blueMarbleRadius: GLOBE_RADIUS * (1 + 0.00002 * TILE_LIFT),
  nightLightsRadius: GLOBE_RADIUS * (1 + 0.00003 * TILE_LIFT),
  landsatRadius: GLOBE_RADIUS * (1 + 0.00004 * TILE_LIFT),
  /** City lights brightness; matches surface nocturnal emission threshold. */
  nightIntensity: 1.4,
  /**
   * The library requests level n when altitude falls below 8/2^n radii. Multiplying by 4
   * pulls two levels ahead: matching screen pixel density rather than appearing blurry
   * until very close.
   */
  thresholdScale: 4,
  /** Altitude in radii: above `fadeStart` the layer is hidden and stops requesting tiles. */
  blueMarble: { fadeStart: 1.1, fadeEnd: 0.75 },
  landsat: { fadeStart: 0.075, fadeEnd: 0.045 },
  /** Clouds are 2K: zooming in would make them blurry artifacts, so they fade out. */
  clouds: { hiddenBelow: 0.05, fullAbove: 0.45 },
  /** Terrain relief hillshading exaggeration. Geometry is not displaced. */
  reliefExaggeration: 2.5,
  /** Adaptive near clipping plane: fraction of distance to surface (minimum in EARTH_HIGH_RES). */
  nearPlane: { fraction: 0.35 },
  maxAnisotropy: 8,
  /** Rendered before heat (0.5), clouds (1), and atmosphere (2). */
  renderOrder: { blueMarble: 0.1, nightLights: 0.15, landsat: 0.2 },
} as const;

// Esri requires "Powered by Esri" and data attribution always visible when its layer is displayed.
export const EARTH_TILE_ATTRIBUTION = EARTH_HIGH_RES.provider === 'esri'
  ? 'Imagery: NASA GIBS · Blue Marble NG · VIIRS Black Marble · Powered by Esri · Esri, Maxar, Earthstar Geographics, and the GIS User Community · Relief: Terrain Tiles (SRTM)'
  : 'Imagery: NASA GIBS · Blue Marble NG · VIIRS Black Marble · Landsat WELD 2000 · Relief: Terrain Tiles (SRTM)';
