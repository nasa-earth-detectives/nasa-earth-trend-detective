import type { GlobeInstance } from 'globe.gl';
import { createEarthTeleconnectionArcs } from './earthTeleconnectionArcs';
import { createEarthRadarRipples } from './earthRadarRipples';
import { createEarthSatelliteOrbits } from './earthSatelliteOrbits';
import { createEarthOceanFlow } from './earthOceanFlow';

export interface EarthLiveSystemApi {
  setArcsVisible(visible: boolean): void;
  setRipplesVisible(visible: boolean): void;
  setSatellitesVisible(visible: boolean): void;
  setOceanFlowVisible(visible: boolean): void;
  dispose(): void;
}

/**
 * Fachada modular para los sistemas dinámicos vivos de la Tierra:
 * Arcos 3D de teleconexiones, ondas de radar en hotspots, constelación de satélites NASA
 * y corrientes oceánicas fluidas (NASA ECCO/OSCAR).
 */
export function createEarthLiveSystem(globe: GlobeInstance): EarthLiveSystemApi {
  const arcs = createEarthTeleconnectionArcs(globe);
  const ripples = createEarthRadarRipples(globe);
  const satellites = createEarthSatelliteOrbits(globe.scene());
  const oceanFlow = createEarthOceanFlow(globe);

  return {
    setArcsVisible: (v) => arcs.setVisible(v),
    setRipplesVisible: (v) => ripples.setVisible(v),
    setSatellitesVisible: (v) => satellites.setVisible(v),
    setOceanFlowVisible: (v) => oceanFlow.setVisible(v),
    dispose: () => {
      arcs.dispose();
      ripples.dispose();
      satellites.dispose();
      oceanFlow.dispose();
    },
  };
}

