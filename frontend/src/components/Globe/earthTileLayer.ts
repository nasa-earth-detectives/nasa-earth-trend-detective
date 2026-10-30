/**
 * Una capa de mosaicos satelitales sobre la escena existente de Globe.gl.
 *
 * No usa `globe.globeTileEngineUrl()`: three-globe ocultaría la esfera base y con ella
 * el material diurno/nocturno, las nubes y la atmósfera ya calibrados. Esta capa vive
 * aparte, encima de la superficie, y sólo aparece al acercar la cámara.
 */
import SlippyMapGlobe from 'three-slippy-map-globe';
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
  /** `fade` en [0,1]; con 0 la capa se oculta. Barato: se puede llamar en cada frame. */
  setFade(fade: number): void;
  /** Recalcula qué mosaicos pedir. Costoso: el orquestador lo limita en el tiempo. */
  refresh(camera: Camera): void;
  dispose(): void;
}

/**
 * Las URL acaban en /nivel/fila/columna: es la única forma de saber qué mosaico llegó. GIBS
 * añade extensión (.jpeg/.png); Esri no la lleva y termina en ?token=….
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

  // Sin gestión de color ni premultiplicado: los bytes de la elevación deben llegar intactos.
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
    // Niveles superiores encima de los inferiores que la librería conserva debajo.
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

    // ImageBitmap decodifica fuera del hilo principal: en giro continuo llegan decenas de
    // mosaicos y decodificarlos en el hilo de render compite con el dibujo de cada frame.
    loader.load(terrainTileUrl(column, row, level), (bitmap) => {
      if (disposed || tile.parent !== layer) { bitmap.close(); return; }
      const texture = new Texture(bitmap);
      // Alturas codificadas en bytes: interpolar canales mezclaría centenas con unidades.
      texture.colorSpace = NoColorSpace;
      texture.flipY = false; // ya volteado al decodificar
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      terrain.value = texture;
      terrainReady.value = 1;
      terrainByTile.set(tile, texture);
    }, undefined, () => { /* Sin relieve: el mosaico se ve igual, sólo sin sombreado. */ });
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
      // Lo que queda es la esfera de respaldo interna de la librería.
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
