import type { GlobeInstance } from 'globe.gl';
import { OCEAN_CURRENTS, type OceanCurrentPath } from './oceanCurrentsData';
export type { OceanCurrentPath };

const FLOW_COLORS: Record<OceanCurrentPath['temperature'], string> = {
  warm: 'rgba(255,154,60,0.75)',
  cold: 'rgba(56,189,248,0.75)',
  neutral: 'rgba(203,213,225,0.6)',
};

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
      // Corriente = flujo suave sobre el mar, no un rótulo de neón: trazo fino, color por
      // temperatura con transparencia y guiones más lentos que los arcos.
      .pathColor((d: object) => FLOW_COLORS[(d as OceanCurrentPath).temperature])
      .pathStroke((d: object) => (d as OceanCurrentPath).stroke * 0.38)
      .pathDashLength((d: object) => (d as OceanCurrentPath).dashLength * 0.6)
      .pathDashGap((d: object) => (d as OceanCurrentPath).dashGap * 1.5)
      .pathDashAnimateTime((d: object) => (d as OceanCurrentPath).animateTime * 1.8)
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
