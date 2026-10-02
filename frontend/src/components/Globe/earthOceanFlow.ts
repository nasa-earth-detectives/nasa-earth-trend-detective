import type { GlobeInstance } from 'globe.gl';
import { OCEAN_CURRENTS, type OceanCurrentPath } from './oceanCurrentsData';
export type { OceanCurrentPath };

/**
 * Módulo de renderizado de corrientes oceánicas fluidas en 3D (Globe.gl).
 * Representa la circulación termohalina y giros eólicos (NASA ECCO/OSCAR).
 */
export function createEarthOceanFlow(globe: GlobeInstance) {
  let visible = true;
  let activePaths: OceanCurrentPath[] = OCEAN_CURRENTS;

  const applyToGlobe = () => {
    globe
      .pathsData(visible ? activePaths : [])
      .pathPoints((d: object) => (d as OceanCurrentPath).coords)
      .pathPointAlt(0.0035)
      .pathColor((d: object) => (d as OceanCurrentPath).color)
      .pathStroke((d: object) => (d as OceanCurrentPath).stroke)
      .pathDashLength((d: object) => (d as OceanCurrentPath).dashLength)
      .pathDashGap((d: object) => (d as OceanCurrentPath).dashGap)
      .pathDashAnimateTime((d: object) => (d as OceanCurrentPath).animateTime)
      .pathResolution(2);
  };

  applyToGlobe();

  return {
    setVisible(nextVisible: boolean) {
      if (visible === nextVisible) return;
      visible = nextVisible;
      applyToGlobe();
    },
    setPaths(nextPaths: OceanCurrentPath[]) {
      activePaths = nextPaths;
      applyToGlobe();
    },
    dispose() {
      globe.pathsData([]);
    },
  };
}
