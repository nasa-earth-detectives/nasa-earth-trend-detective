import type { GlobeInstance } from 'globe.gl';
import { createEarthTeleconnectionArcs } from './earthTeleconnectionArcs';
import { createEarthRadarRipples } from './earthRadarRipples';
import { createEarthSatelliteOrbits } from './earthSatelliteOrbits';

export interface EarthLiveSystemApi {
  setArcsVisible(visible: boolean): void;
  setRipplesVisible(visible: boolean): void;
  setSatellitesVisible(visible: boolean): void;
  dispose(): void;
}

/**
 * Fachada modular para los sistemas dinámicos vivos de la Tierra:
 * Arcos 3D de teleconexiones, ondas de radar en hotspots y constelación de satélites NASA.
 */
export function createEarthLiveSystem(globe: GlobeInstance): EarthLiveSystemApi {
  const arcs = createEarthTeleconnectionArcs(globe);
  const ripples = createEarthRadarRipples(globe);
  const satellites = createEarthSatelliteOrbits(globe.scene());

  return {
    setArcsVisible: (v) => arcs.setVisible(v),
    setRipplesVisible: (v) => ripples.setVisible(v),
    setSatellitesVisible: (v) => satellites.setVisible(v),
    dispose: () => {
      arcs.dispose();
      ripples.dispose();
      satellites.dispose();
    },
  };
}
