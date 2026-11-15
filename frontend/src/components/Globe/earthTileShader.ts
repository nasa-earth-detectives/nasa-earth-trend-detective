/**
 * Extends the MeshLambertMaterial that three-slippy-map-globe creates for each tile.
 *
 * Why Lambert rather than a custom ShaderMaterial: the library already sets it up and responds to
 * scene lights, so real UTC sunlight naturally illuminates tiles with no additional code.
 * Only missing capabilities are added here:
 * - relief: perturbed normals using Terrarium elevation slopes;
 * - night: tile becomes transparent to reveal Black Marble lights;
 * - no-data fill: Landsat WELD fills ocean with pure black, which is keyed out;
 * - shared gradual fade-in per layer.
 */
import type { MeshLambertMaterial, Texture, Vector3 } from 'three';

/** Uniforms shared across all tiles in a layer: updating them alters all tiles at once. */
export interface TileShaderShared {
  fade: { value: number };
  sunDirection: { value: Vector3 };
  exaggeration: { value: number };
}

/** Tile-specific uniforms. */
export interface TileShaderOwn {
  keyBlack: boolean;
  /** Emissive nocturnal lights layer instead of illuminated daytime imagery. */
  night: boolean;
  nightIntensity: number;
  /** Visible on both hemispheres: dimmed at night like moonlight (Esri upon zoom). */
  allSides: boolean;
  /** Night layer over detail imagery: only lights are opaque. */
  lightsOnly: boolean;
  level: number;
  terrain: { value: Texture | null };
  terrainReady: { value: number };
}

const VERTEX_PARS = /* glsl */ `
varying vec2 vTileUv;
varying vec3 vTileWorldNormal;
varying vec3 vTileEastView;
varying vec3 vTileNorthView;
`;

// three-globe convention: Y is the polar axis and the prime meridian faces +Z,
// so local east is the derivative with respect to longitude: (z, 0, -x).
const VERTEX_MAIN = /* glsl */ `
vTileUv = uv;
vTileWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
vec3 tileEast = normalize(vec3(objectNormal.z, 0.0, -objectNormal.x));
vec3 tileNorth = normalize(cross(objectNormal, tileEast));
vTileEastView = normalize(normalMatrix * tileEast);
vTileNorthView = normalize(normalMatrix * tileNorth);
`;

const FRAGMENT_PARS = /* glsl */ `
uniform float tileFade;
uniform vec3 tileSunDirection;
uniform float tileExaggeration;
uniform float tileKeyBlack;
uniform float tileNight;
uniform float tileNightIntensity;
uniform float tileAllSides;
uniform float tileLightsOnly;
uniform float tileLevel;
uniform sampler2D tileTerrain;
uniform float tileTerrainReady;
varying vec2 vTileUv;
varying vec3 vTileWorldNormal;
varying vec3 vTileEastView;
varying vec3 vTileNorthView;

// Terrarium: height = R·256 + G + B/256 − 32768 meters. Ocean is clamped to sea level.
float tileHeight(vec2 uv) {
  vec3 c = texture2D(tileTerrain, uv).rgb * 255.0;
  return max(c.r * 256.0 + c.g + c.b / 256.0 - 32768.0, 0.0);
}
`;

// Linear threshold 0.004 ≈ 13/255 in sRGB: above JPEG noise of black fill and
// below the darkest forests in the mosaic.
const FRAGMENT_ALPHA = /* glsl */ `
#ifdef USE_MAP
  if (tileKeyBlack > 0.5 && max(sampledDiffuseColor.r, max(sampledDiffuseColor.g, sampledDiffuseColor.b)) < 0.004) discard;
  // City lights over detail imagery: dark blue background (≈0.02 linear) vanishes
  // and lights (0.3-1) remain opaque. Overlapping levels no longer accumulate brightness.
  if (tileLightsOnly > 0.5) diffuseColor.a *= smoothstep(0.03, 0.2, max(sampledDiffuseColor.r, max(sampledDiffuseColor.g, sampledDiffuseColor.b)));
#endif
float tileSunCosine = dot(normalize(vTileWorldNormal), normalize(tileSunDirection));
float tileDayMask = smoothstep(-0.14, 0.04, tileSunCosine);
// Daytime layers fade out at night; nocturnal layer fades out during the day. Same terminator for both.
// allSides: detail imagery is retained at night (darkened in FRAGMENT_SKY_FILL).
diffuseColor.a *= tileFade * (tileAllSides > 0.5 ? 1.0 : mix(tileDayMask, 1.0 - tileDayMask, tileNight));
if (diffuseColor.a < 0.003) discard;
`;

// Mercator is conformal: a texel measures the same east-west as north-south,
// 40 075 016.686 m · cos(lat) / (256 · 2^level).
// Exaggeration decreases with zoom level: up to 8 coarse sampling flattens slopes
// requiring enhancement; by 11-12 slopes are true scale and Landsat imagery includes
// natural shadows, so full exaggeration yielded pitch-black slopes (verified on Mt. Everest).
const FRAGMENT_RELIEF = /* glsl */ `
if (tileTerrainReady > 0.5) {
  float reliefScale = clamp(1.0 - (tileLevel - 8.0) * 0.1, 0.6, 1.0);
  float texel = 1.0 / 256.0;
  float hE = tileHeight(vTileUv + vec2(texel, 0.0));
  float hW = tileHeight(vTileUv - vec2(texel, 0.0));
  float hN = tileHeight(vTileUv + vec2(0.0, texel));
  float hS = tileHeight(vTileUv - vec2(0.0, texel));
  vec3 worldNormal = normalize(vTileWorldNormal);
  float latCos = sqrt(max(1.0 - worldNormal.y * worldNormal.y, 1e-4));
  float metersPerTexel = 40075016.686 * latCos / (256.0 * exp2(tileLevel));
  vec2 slope = vec2(hE - hW, hN - hS) / (2.0 * metersPerTexel);
  normal = normalize(normal - tileExaggeration * reliefScale * (slope.x * vTileEastView + slope.y * vTileNorthView));
}
`;

// Sky light only on the daytime face. Scene ambient light (0.12) is deliberately low
// for night, but during the day left shaded slopes at ≈4% of the sunlit side, almost
// pitch black. 0.15/π of albedo lifts them to a plausible fraction without flattening relief.
// Night layer receives no illumination: emits Black Marble radiance directly.
const FRAGMENT_SKY_FILL = /* glsl */ `
if (tileNight > 0.5) {
  outgoingLight = diffuseColor.rgb * tileNightIntensity;
} else {
  outgoingLight += diffuseColor.rgb * (0.15 * RECIPROCAL_PI) * smoothstep(-0.05, 0.25, tileSunCosine);
  // Moonlight night: faint blue tint, enough to discern coastlines and road grids.
  if (tileAllSides > 0.5) outgoingLight += diffuseColor.rgb * vec3(0.12, 0.14, 0.2) * (1.0 - tileDayMask);
}
`;

export function patchTileMaterial(
  material: MeshLambertMaterial,
  shared: TileShaderShared,
  own: TileShaderOwn,
): void {
  material.transparent = true;
  material.polygonOffset = true;
  material.polygonOffsetFactor = -1;
  material.polygonOffsetUnits = -4;
  // Tiles form a thin skin over the base sphere, which already writes depth. If they wrote
  // depth, polygonOffset (which grows with triangle inclination) pushed them ahead of the
  // cloud layer (1.0012 R), slicing through it in dark triangular artifacts at mid altitude.
  // The library resets depthWrite = true on level changes (causing triangles to return):
  // locking the property ensures it always returns false.
  Object.defineProperty(material, 'depthWrite', { get: () => false, set: () => {}, configurable: true });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      tileFade: shared.fade,
      tileSunDirection: shared.sunDirection,
      tileExaggeration: shared.exaggeration,
      tileKeyBlack: { value: own.keyBlack ? 1 : 0 },
      tileNight: { value: own.night ? 1 : 0 },
      tileNightIntensity: { value: own.nightIntensity },
      tileAllSides: { value: own.allSides ? 1 : 0 },
      tileLightsOnly: { value: own.lightsOnly ? 1 : 0 },
      tileLevel: { value: own.level },
      tileTerrain: own.terrain,
      tileTerrainReady: own.terrainReady,
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX_MAIN}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${FRAGMENT_ALPHA}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FRAGMENT_RELIEF}`)
      .replace('#include <opaque_fragment>', `${FRAGMENT_SKY_FILL}\n#include <opaque_fragment>`);
  };
  // Dynamic cache key reflecting structural material features (active texture map).
  material.customProgramCacheKey = () => `earth-detail-tile-v6_${material.map ? 'map' : 'nomap'}`;
  material.needsUpdate = true;
}
