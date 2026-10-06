/**
 * Amplía el material Lambert que three-slippy-map-globe crea para cada mosaico.
 *
 * Por qué Lambert y no un ShaderMaterial propio: la librería ya lo crea y responde a
 * las luces de la escena, de modo que el sol UTC real ilumina los mosaicos sin código
 * adicional. Aquí sólo se añade lo que el material no sabe hacer:
 * - relieve: normales perturbadas con la pendiente de la elevación Terrarium;
 * - noche: el mosaico se vuelve transparente y deja ver las luces de Black Marble;
 * - relleno sin dato: Landsat WELD rellena el océano de negro puro y se descarta;
 * - aparición gradual compartida por capa.
 */
import type { MeshLambertMaterial, Texture, Vector3 } from 'three';

/** Uniformes compartidos por todos los mosaicos de una capa: un cambio los mueve a todos. */
export interface TileShaderShared {
  fade: { value: number };
  sunDirection: { value: Vector3 };
  exaggeration: { value: number };
}

/** Uniformes propios de un mosaico. */
export interface TileShaderOwn {
  keyBlack: boolean;
  /** Capa emisiva de luces nocturnas en lugar de imagen diurna iluminada. */
  night: boolean;
  nightIntensity: number;
  /** Visible en las dos caras: de noche, oscurecida como con luz de luna (Esri al acercar). */
  allSides: boolean;
  /** Capa nocturna sobre imagen de detalle: sólo las luces son opacas. */
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

// Convención de three-globe: Y es el eje polar y el meridiano cero mira hacia +Z,
// así que el este local es la derivada respecto a la longitud: (z, 0, -x).
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

// Terrarium: altura = R·256 + G + B/256 − 32768 metros. El océano se deja a nivel del mar.
float tileHeight(vec2 uv) {
  vec3 c = texture2D(tileTerrain, uv).rgb * 255.0;
  return max(c.r * 256.0 + c.g + c.b / 256.0 - 32768.0, 0.0);
}
`;

// Umbral lineal 0.004 ≈ 13/255 en sRGB: por encima del ruido JPEG del relleno negro y
// por debajo de los bosques más oscuros del mosaico.
const FRAGMENT_ALPHA = /* glsl */ `
#ifdef USE_MAP
  if (tileKeyBlack > 0.5 && max(sampledDiffuseColor.r, max(sampledDiffuseColor.g, sampledDiffuseColor.b)) < 0.004) discard;
  // Luces de ciudad sobre la imagen de detalle: el azul oscuro de fondo (≈0,02 lineal) desaparece
  // y las luces (0,3-1) quedan opacas. Los niveles superpuestos ya no acumulan brillo.
  if (tileLightsOnly > 0.5) diffuseColor.a *= smoothstep(0.03, 0.2, max(sampledDiffuseColor.r, max(sampledDiffuseColor.g, sampledDiffuseColor.b)));
#endif
float tileSunCosine = dot(normalize(vTileWorldNormal), normalize(tileSunDirection));
float tileDayMask = smoothstep(-0.14, 0.04, tileSunCosine);
// Las capas diurnas se apagan de noche; la nocturna, de día. Mismo terminador para ambas.
// allSides: la imagen de detalle se mantiene de noche (se oscurece en FRAGMENT_SKY_FILL).
diffuseColor.a *= tileFade * (tileAllSides > 0.5 ? 1.0 : mix(tileDayMask, 1.0 - tileDayMask, tileNight));
if (diffuseColor.a < 0.003) discard;
`;

// Mercator es conforme: un texel mide lo mismo en este-oeste que en norte-sur,
// 40 075 016,686 m · cos(lat) / (256 · 2^nivel).
// La exageración baja con el nivel: hasta 8 el muestreo grueso suaviza las pendientes y
// hace falta realzarlas; en 11-12 ya son reales y la foto Landsat trae sus propias
// sombras, así que la exageración plena dejaba laderas negras (verificado en el Everest).
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

// Luz de cielo sólo en la cara diurna. La ambiental de la escena (0,12) es baja a propósito
// para la noche, pero de día dejaba las laderas a la sombra en ≈4 % del lado soleado, casi
// negras. 0,15/π del albedo las sube a una fracción plausible sin aplanar el relieve.
// La capa nocturna no recibe luz: emite la radiancia de Black Marble tal cual.
const FRAGMENT_SKY_FILL = /* glsl */ `
if (tileNight > 0.5) {
  outgoingLight = diffuseColor.rgb * tileNightIntensity;
} else {
  outgoingLight += diffuseColor.rgb * (0.15 * RECIPROCAL_PI) * smoothstep(-0.05, 0.25, tileSunCosine);
  // Noche con luz de luna: azulada y tenue, suficiente para distinguir calles y costas.
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
  // Los mosaicos son una película sobre la esfera base, que ya escribe profundidad. Si escribieran
  // la suya, el polygonOffset (que crece con la inclinación del triángulo) los adelantaba a la capa
  // de nubes (1,0012 R) y la recortaba en triángulos oscuros a media altura.
  // La librería vuelve a poner depthWrite = true en cada cambio de nivel (lo sacaba a la luz el
  // regreso de los triángulos): se bloquea la propiedad para que siempre valga false.
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
  // Mismo código para todos los mosaicos: un único programa compilado y reutilizado.
  material.customProgramCacheKey = () => 'earth-detail-tile-v6';
  material.needsUpdate = true;
}
