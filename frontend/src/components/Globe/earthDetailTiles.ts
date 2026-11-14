/**
 * Orchestrates satellite detail levels based on camera altitude.
 *
 * In orbit the calibrated surface rules (day/night, clouds, atmosphere). Upon zoom:
 * tiled Blue Marble (≤611 m/px), followed by Landsat WELD (≤38 m/px), VIIRS night lights
 * on the night side, 2K clouds fade out, and near clipping plane contracts.
 *
 * Bounded performance cost: opacities update at most once per frame and only when the
 * camera moved; tile lookups run at most every `REFRESH_INTERVAL_MS`.
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

/** Querying tiles on every frame of a spin adds nothing: network latency bounds loading anyway. */
const REFRESH_INTERVAL_MS = 120;

/** 0 above `start`, 1 below `end`, with smooth hermite interpolation. */
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
  // With Esri visible at night, VIIRS lights render on top and strictly as lights (transparent
  // background): visible over the darkened image rather than obscured by it.
  const esriNight = EARTH_HIGH_RES.source.allSides === true;
  const nightLights = layer({ ...EARTH_TILE_SOURCES.nightLights, lightsOnly: esriNight }, config.nightLightsRadius,
    esriNight ? config.renderOrder.landsat + 0.05 : config.renderOrder.nightLights);
  // Landsat (NASA) or Esri World Imagery if key present: identical altitude band and fade.
  const highRes = layer(EARTH_HIGH_RES.source, config.landsatRadius, config.renderOrder.landsat);
  const layers = [blueMarble, nightLights, highRes];
  // With Esri, camera can descend to ~250 m to reach 0.3 m/px tiles. Applied on every
  // change frame because useGlobeScene sets its minimum after creating this layer.
  const minDistance = EARTH_HIGH_RES.minAltitudeKm === null ? null
    : GLOBE_RADIUS * (1 + EARTH_HIGH_RES.minAltitudeKm / 6371);

  // three-slippy-map-globe builds tiles with 5° facets: between vertices they sag up to
  // R·(1 − cos 2.5°) ≈ 606 m under the sphere, deeper than the 13-255 m layer elevations. The
  // base sphere vertices (4° grid) previously peeked through in a visible diamond grid pattern.
  // Sinking the base sphere by 0.15% (9.6 km) keeps it strictly underneath; in orbit this is
  // sub-pixel and close up it is covered by tiles.
  // Globe mesh is not yet in the scene when this layer mounts (Globe.gl mounts it afterward):
  // traversed on each adjustment until located. Checked: searching here earlier found scale still at 1.
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

    // In orbit a wide near plane gives precision to clouds; close up it must shrink.
    if (camera instanceof PerspectiveCamera) {
      const near = Math.min(GLOBE_CONFIG.nearPlane,
        Math.max(EARTH_HIGH_RES.nearPlaneMin, distanceToSurface * config.nearPlane.fraction));
      if (Math.abs(camera.near - near) > near * 0.05) {
        camera.near = near;
        camera.updateProjectionMatrix();
      }
    }

    // Only render whichever terminator hemisphere actually enters the visible horizon.
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

    // Immediate if interval elapsed; otherwise a deferred call captures final camera settling.
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
