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
  /** Arcos y anillos comparten los mismos extremos. */
  setConnections(connections: Teleconnection[]): void;
  /** Sol, destello y Luna van con el interruptor de estrellas: son el mismo fondo espacial. */
  setSunVisible(visible: boolean): void;
  dispose(): void;
}

/**
 * Fachada modular para los sistemas dinámicos vivos de la Tierra:
 * Arcos 3D de teleconexiones, ondas de radar en hotspots, constelación de satélites NASA
 * y corrientes oceánicas fluidas (NASA ECCO/OSCAR).
 */
export function createEarthLiveSystem(globe: GlobeInstance, sunDirection: Vector3): EarthLiveSystemApi {
  const arcs = createEarthTeleconnectionArcs(globe);
  const ripples = createEarthRadarRipples(globe);
  const satellites = createEarthSatelliteOrbits(globe.scene(), globe.renderer(), sunDirection);
  const oceanFlow = createEarthOceanFlow(globe);
  const sun = createEarthSunGlare(globe.scene(), sunDirection);
  const moon = createEarthMoon(globe.scene());

  // Cerca del suelo los arcos (tubos de ~14 km) y los anillos se veían como barras gruesas que
  // cruzaban la pantalla: por debajo de 0,15 radios se ocultan, respetando lo que elija el usuario.
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

