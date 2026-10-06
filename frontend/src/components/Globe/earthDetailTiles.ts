/**
 * Orquesta el detalle satelital según la altitud de la cámara.
 *
 * En órbita manda la superficie calibrada (día/noche, nubes, atmósfera). Al acercar:
 * Blue Marble por mosaicos (≤611 m/px), después Landsat WELD (≤38 m/px), luces de VIIRS
 * en la cara nocturna, las nubes 2K se retiran y el plano cercano baja.
 *
 * Coste acotado: las opacidades se ajustan como mucho una vez por frame y sólo si la
 * cámara cambió; la búsqueda de mosaicos, como mucho cada `REFRESH_INTERVAL_MS`.
 */
import { Mesh, PerspectiveCamera, Vector3 } from 'three';
import type { GlobeInstance } from 'globe.gl';
import { GLOBE_CONFIG, GLOBE_RADIUS } from './globeConfig';
import { EARTH_HIGH_RES, EARTH_TILE_CONFIG, EARTH_TILE_SOURCES, type EarthTileSource } from './earthTileConfig';
import { createEarthTileLayer, type EarthTileLayer } from './earthTileLayer';
import { visibleTerminatorSides } from './earthTileVisibility';

interface DetailSurface {
  sunDirection: Vector3;
  setCloudFade(fade: number): void;
}

/** Buscar mosaicos en cada frame de un giro no aporta nada: llegan por red igualmente. */
const REFRESH_INTERVAL_MS = 120;

/** 0 por encima de `start`, 1 por debajo de `end`, con transición suave. */
function fadeBelow(altitude: number, start: number, end: number): number {
  const t = Math.min(1, Math.max(0, (start - altitude) / (start - end)));
  return t * t * (3 - 2 * t);
}

export function createEarthDetailTiles(globe: GlobeInstance, container: HTMLElement, surface: DetailSurface) {
  const scene = globe.scene();
  const camera = globe.camera();
  const controls = globe.controls();
  const renderer = globe.renderer();
  const config = EARTH_TILE_CONFIG;
  const sunDirection = { value: surface.sunDirection };
  const exaggeration = { value: config.reliefExaggeration };
  const layer = (source: EarthTileSource, radius: number, renderOrder: number): EarthTileLayer =>
    createEarthTileLayer(scene, {
      source, radius, renderOrder, renderer,
      shared: { fade: { value: 0 }, sunDirection, exaggeration },
    });
  const blueMarble = layer(EARTH_TILE_SOURCES.blueMarble, config.blueMarbleRadius, config.renderOrder.blueMarble);
  // Con Esri visible de noche, las luces de VIIRS se dibujan encima y sólo como luces (fondo
  // transparente): se ven sobre la imagen oscurecida en lugar de quedar tapadas por ella.
  const esriNight = EARTH_HIGH_RES.source.allSides === true;
  const nightLights = layer({ ...EARTH_TILE_SOURCES.nightLights, lightsOnly: esriNight }, config.nightLightsRadius,
    esriNight ? config.renderOrder.landsat + 0.05 : config.renderOrder.nightLights);
  // Landsat (NASA) o Esri World Imagery si hay clave: misma franja de altitud y mismo fundido.
  const highRes = layer(EARTH_HIGH_RES.source, config.landsatRadius, config.renderOrder.landsat);
  const layers = [blueMarble, nightLights, highRes];
  // Con Esri la cámara puede bajar a ~250 m para que lleguen los mosaicos de 0,3 m/px. Se aplica
  // en cada frame de cambio porque useGlobeScene fija su mínimo después de crear esta capa.
  const minDistance = EARTH_HIGH_RES.minAltitudeKm === null ? null
    : GLOBE_RADIUS * (1 + EARTH_HIGH_RES.minAltitudeKm / 6371);

  // three-slippy-map-globe construye los mosaicos con caras de 5°: entre vértices se hunden hasta
  // R·(1 − cos 2,5°) ≈ 606 m bajo la esfera, más que los 13-255 m a los que flotan las capas. Los
  // vértices de la esfera base (rejilla de 4°) asomaban entonces por encima y dibujaban rombos en
  // cuadrícula. Hundir la esfera base un 0,15 % (9,6 km) la deja siempre debajo; en órbita es
  // menos de un píxel y, de cerca, la tapan los mosaicos.
  // La malla del globo no está aún en la escena al crear esta capa (Globe.gl la monta después):
  // se busca en cada ajuste hasta encontrarla. Comprobado: buscándola aquí la escala seguía en 1.
  const BASE_GLOBE_SINK = 0.9985;
  let baseGlobe: Mesh | null = null;
  const sinkBaseGlobe = (): void => {
    if (baseGlobe) return;
    scene.traverse((object) => {
      if (!baseGlobe && object instanceof Mesh && object.material === globe.globeMaterial()) baseGlobe = object;
    });
    (baseGlobe as Mesh | null)?.scale.setScalar(BASE_GLOBE_SINK);
  };

  const cameraDirection = new Vector3();
  let frame: number | undefined;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let lastRefresh = 0;
  let active = false;
  let disposed = false;

  const refresh = (): void => {
    refreshTimer = undefined;
    if (disposed) return;
    lastRefresh = performance.now();
    layers.forEach((tileLayer) => tileLayer.refresh(camera));
  };

  const apply = (): void => {
    frame = undefined;
    if (disposed) return;
    sinkBaseGlobe();
    if (minDistance !== null && controls.minDistance !== minDistance) controls.minDistance = minDistance;
    const distanceToSurface = camera.position.length() - GLOBE_RADIUS;
    const altitude = distanceToSurface / GLOBE_RADIUS;

    // En órbita el plano cercano grande da precisión a las nubes; cerca debe encogerse.
    if (camera instanceof PerspectiveCamera) {
      const near = Math.min(GLOBE_CONFIG.nearPlane,
        Math.max(EARTH_HIGH_RES.nearPlaneMin, distanceToSurface * config.nearPlane.fraction));
      if (Math.abs(camera.near - near) > near * 0.05) {
        camera.near = near;
        camera.updateProjectionMatrix();
      }
    }

    // Sólo se dibuja la cara del terminador que de verdad entra en el horizonte visible.
    cameraDirection.copy(camera.position).normalize();
    const sides = visibleTerminatorSides(cameraDirection, surface.sunDirection, altitude);
    const regionalFade = fadeBelow(altitude, config.blueMarble.fadeStart, config.blueMarble.fadeEnd);
    blueMarble.setFade(sides.day ? regionalFade : 0);
    nightLights.setFade(sides.night ? regionalFade : 0);
    highRes.setFade(sides.day || esriNight ? fadeBelow(altitude, config.landsat.fadeStart, config.landsat.fadeEnd) : 0);
    surface.setCloudFade(1 - fadeBelow(altitude, config.clouds.fullAbove, config.clouds.hiddenBelow));

    const nowActive = regionalFade > 0;
    if (nowActive !== active) {
      active = nowActive;
      container.dataset.earthTiles = active ? 'active' : 'idle';
    }

    // Inmediato si hace tiempo del último; si no, una llamada diferida recoge la posición final.
    const wait = REFRESH_INTERVAL_MS - (performance.now() - lastRefresh);
    if (wait <= 0) refresh();
    else if (refreshTimer === undefined) refreshTimer = setTimeout(refresh, wait);
  };

  const schedule = (): void => {
    if (frame === undefined && !disposed) frame = requestAnimationFrame(apply);
  };

  controls.addEventListener('change', schedule);
  container.dataset.earthTiles = 'idle';
  schedule();

  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
      controls.removeEventListener('change', schedule);
      layers.forEach((tileLayer) => tileLayer.dispose());
      (baseGlobe as Mesh | null)?.scale.setScalar(1);
      baseGlobe = null;
      surface.setCloudFade(1);
      delete container.dataset.earthTiles;
    },
  };
}
