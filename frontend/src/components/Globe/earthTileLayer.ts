/**
 * A satellite tile layer on top of Globe.gl's existing scene.
 *
 * Does not use `globe.globeTileEngineUrl()`: three-globe would hide the base sphere and with it
 * the calibrated day/night material, clouds, and atmosphere. This layer lives separately,
 * above the surface, appearing only when the camera zooms in.
 */
import SlippyMapGlobe from 'three-slippy-map-globe';
import { requestSceneFrame } from './sceneFrames';
import {
  ImageBitmapLoader, Mesh, MeshLambertMaterial, NearestFilter, NoColorSpace, Texture,
  type Camera, type Object3D, type Scene, type WebGLRenderer,
} from 'three';
import { EARTH_TILE_CONFIG, terrainTileUrl, type EarthTileSource } from './earthTileConfig';
import { patchTileMaterial, type TileShaderShared } from './earthTileShader';

interface EarthTileLayerOptions {
  source: EarthTileSource;
  radius: number;
  renderOrder: number;
  shared: TileShaderShared;
  renderer: WebGLRenderer;
}

export interface EarthTileLayer {
  /** `fade` in [0,1]; at 0 the layer is hidden. Cheap: can be called every frame. */
  setFade(fade: number): void;
  /** Recalculates tile requests. Expensive: throttled over time by the orchestrator. */
  refresh(camera: Camera): void;
  dispose(): void;
}

/**
 * URLs end in /level/row/column: the only reliable way to know which tile arrived. GIBS
 * appends an extension (.jpeg/.png); Esri does not and ends with ?token=….
 */
const TILE_URL_PATTERN = /\/(\d+)\/(\d+)\/(\d+)(?:\.(?:jpe?g|png))?(?:\?[^/]*)?$/;

export function createEarthTileLayer(scene: Scene, options: EarthTileLayerOptions): EarthTileLayer {
  const { source, shared, renderer } = options;
  const layer = new SlippyMapGlobe(options.radius, {
    tileUrl: source.url,
    minLevel: source.minLevel,
    maxLevel: source.maxLevel,
    mercatorProjection: true,
  });
  layer.name = `earth-tiles-${source.id}`;
  layer.thresholds = layer.thresholds.map((threshold) => threshold * EARTH_TILE_CONFIG.thresholdScale);
  layer.visible = false;

  // No color management or premultiplication: elevation bytes must arrive unaltered.
  const loader = new ImageBitmapLoader().setOptions({
    imageOrientation: 'flipY',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  });
  const terrainByTile = new Map<Object3D, Texture>();
  const anisotropy = Math.min(EARTH_TILE_CONFIG.maxAnisotropy, renderer.capabilities.getMaxAnisotropy());
  let disposed = false;

  const releaseTexture = (texture: Texture): void => {
    texture.dispose();
    (texture.image as ImageBitmap | null)?.close?.();
  };
  const releaseTerrain = (tile: Object3D): void => {
    const texture = terrainByTile.get(tile);
    if (texture) releaseTexture(texture);
    terrainByTile.delete(tile);
  };

  const prepareTile = ({ child: tile }: { child: Object3D }): void => {
    if (!(tile instanceof Mesh) || !(tile.material instanceof MeshLambertMaterial)) return;
    const material = tile.material;
    const image = material.map?.image as HTMLImageElement | undefined;
    const match = TILE_URL_PATTERN.exec(image?.src ?? '');
    if (!match || !material.map) return;
    const [level, row, column] = [Number(match[1]), Number(match[2]), Number(match[3])];

    tile.raycast = () => {};
    // Tiles keep arriving after the camera stops: a scene that draws on demand has to show each one.
    requestSceneFrame(layer);
    // Higher zoom levels above lower ones preserved underneath by the library.
    tile.renderOrder = options.renderOrder + level * 0.001;
    material.map.anisotropy = anisotropy;

    const terrain = { value: null as Texture | null };
    const terrainReady = { value: 0 };
    patchTileMaterial(material, shared, {
      keyBlack: source.keyBlack,
      night: source.night,
      nightIntensity: EARTH_TILE_CONFIG.nightIntensity,
      allSides: source.allSides ?? false,
      lightsOnly: source.lightsOnly ?? false,
      level,
      terrain,
      terrainReady,
    });
    if (!source.terrain) return;

    // ImageBitmap decodes off the main thread: continuous rotation brings dozens of
    // tiles; decoding them on the render thread stutters frame drawing.
    loader.load(terrainTileUrl(column, row, level), (bitmap) => {
      if (disposed || tile.parent !== layer) { bitmap.close(); return; }
      const texture = new Texture(bitmap);
      // Heights encoded as bytes: channel interpolation would blend hundreds with units.
      texture.colorSpace = NoColorSpace;
      texture.flipY = false; // already flipped during decoding
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      terrain.value = texture;
      terrainReady.value = 1;
      terrainByTile.set(tile, texture);
      requestSceneFrame(layer);
    }, undefined, () => { /* Without relief: tile still renders, just without hillshading. */ });
  };

  const forgetTile = ({ child }: { child: Object3D }): void => releaseTerrain(child);

  layer.addEventListener('childadded', prepareTile);
  layer.addEventListener('childremoved', forgetTile);
  scene.add(layer);

  return {
    setFade(fade) {
      if (disposed) return;
      shared.fade.value = fade;
      layer.visible = fade > 0.001;
    },
    refresh(camera) {
      if (!disposed && layer.visible) layer.updatePov(camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      layer.clearTiles();
      layer.removeEventListener('childadded', prepareTile);
      layer.removeEventListener('childremoved', forgetTile);
      terrainByTile.forEach(releaseTexture);
      terrainByTile.clear();
      // What remains is the library's internal fallback sphere.
      layer.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => m.dispose());
        }
      });
      scene.remove(layer);
    },
  };
}
