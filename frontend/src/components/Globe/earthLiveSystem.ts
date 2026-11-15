import type { GlobeInstance } from 'globe.gl';
import type { Vector3 } from 'three';
import type { Teleconnection } from '../../types/teleconnection.types';
import { createEarthTeleconnectionArcs } from './earthTeleconnectionArcs';
import { createEarthRadarRipples } from './earthRadarRipples';
import { createEarthSatelliteOrbits } from './earthSatelliteOrbits';
import { createEarthOceanFlow } from './earthOceanFlow';
import { createEarthSunGlare } from './earthSunGlare';
import { createEarthMoon } from './earthMoon';

export interface EarthLiveSystemApi {
  setArcsVisible(visible: boolean): void;
  setRipplesVisible(visible: boolean): void;
  setSatellitesVisible(visible: boolean): void;
  setOceanFlowVisible(visible: boolean): void;
  /** Arcs and ripples share the same endpoints. */
  setConnections(connections: Teleconnection[]): void;
  /** Sun, lens flare, and Moon follow the star field toggle: they are part of the same celestial background. */
  setSunVisible(visible: boolean): void;
  dispose(): void;
}

/**
 * Modular facade for Earth's dynamic living systems:
 * 3D teleconnection arcs, hotspot radar ripples, NASA satellite constellation,
 * and fluid ocean currents (NASA ECCO/OSCAR).
 */
export function createEarthLiveSystem(globe: GlobeInstance, sunDirection: Vector3,
  options: { celestial: boolean; satellites: boolean } = { celestial: true, satellites: true }): EarthLiveSystemApi {
  // What the lite profile leaves out is never built: no models or textures are downloaded for it.
  const absent = { setVisible: (_visible: boolean): void => {}, dispose: (): void => {} };
  const arcs = createEarthTeleconnectionArcs(globe);
  const ripples = createEarthRadarRipples(globe);
  const satellites = options.satellites ? createEarthSatelliteOrbits(globe.scene(), globe.renderer(), sunDirection) : absent;
  const oceanFlow = createEarthOceanFlow(globe);
  const sun = options.celestial ? createEarthSunGlare(globe.scene(), sunDirection) : absent;
  const moon = options.celestial ? createEarthMoon(globe.scene()) : absent;

  // Close to ground, arcs (~14 km tubes) and rings appeared as thick bars crossing
  // the screen: below 0.15 radii they are hidden, respecting user preference.
  const NEAR_GROUND_ALTITUDE = 0.15;
  const controls = globe.controls();
  let arcsWanted = true;
  let ripplesWanted = true;
  let nearGround = false;
  const apply = (): void => {
    arcs.setVisible(arcsWanted && !nearGround);
    ripples.setVisible(ripplesWanted && !nearGround);
  };
  const onCameraChange = (): void => {
    const next = globe.camera().position.length() / globe.getGlobeRadius() - 1 < NEAR_GROUND_ALTITUDE;
    if (next !== nearGround) {
      nearGround = next;
      apply();
    }
  };
  controls.addEventListener('change', onCameraChange);

  return {
    setArcsVisible: (v) => { arcsWanted = v; apply(); },
    setRipplesVisible: (v) => { ripplesWanted = v; apply(); },
    setSatellitesVisible: (v) => satellites.setVisible(v),
    setOceanFlowVisible: (v) => oceanFlow.setVisible(v),
    setSunVisible: (v) => { sun.setVisible(v); moon.setVisible(v); },
    setConnections: (connections) => {
      arcs.setConnections(connections);
      ripples.setConnections(connections);
    },
    dispose: () => {
      controls.removeEventListener('change', onCameraChange);
      arcs.dispose();
      ripples.dispose();
      satellites.dispose();
      oceanFlow.dispose();
      sun.dispose();
      moon.dispose();
    },
  };
}

