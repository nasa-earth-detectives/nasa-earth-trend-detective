import type { GlobeInstance } from 'globe.gl';

export interface TeleconnectionArc {
  id: string;
  name: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  altitude: number;
  stroke: number;
  dashLength: number;
  dashGap: number;
  animateTime: number;
  description: string;
}

export const TELECONNECTION_PRESETS: TeleconnectionArc[] = [
  {
    id: 'amoc-conveyor',
    name: 'AMOC: Transporte Térmico Superficial',
    startLat: 15.0,
    startLng: -50.0,
    endLat: 78.22,
    endLng: 15.63,
    color: ['#00e5ff', '#ff3366'],
    altitude: 0.35,
    stroke: 0.8,
    dashLength: 0.45,
    dashGap: 0.15,
    animateTime: 2200,
    description: 'Flujo de calor meridional desde los trópicos hacia la amplificación ártica.',
  },
  {
    id: 'amoc-sinking-gyre',
    name: 'Giro Subpolar: Retorno y Hundimiento Profundo',
    startLat: 78.22,
    startLng: 15.63,
    endLat: 55.0,
    endLng: -30.0,
    color: ['#ff3366', '#00bfff'],
    altitude: 0.22,
    stroke: 0.6,
    dashLength: 0.35,
    dashGap: 0.2,
    animateTime: 2800,
    description: 'Hundimiento de agua densa en el giro subpolar (agujero de enfriamiento).',
  },
  {
    id: 'sahara-amazon-fertilization',
    name: 'Teleconexión Aerosoles: Sahara ➔ Amazonía',
    startLat: 17.0,
    startLng: 18.0,
    endLat: -3.46,
    endLng: -62.21,
    color: ['#ffd700', '#00ff88'],
    altitude: 0.42,
    stroke: 0.7,
    dashLength: 0.4,
    dashGap: 0.2,
    animateTime: 3200,
    description: 'Transporte transatlántico de nutrientes minerales de polvo mineral a la cuenca amazónica.',
  },
  {
    id: 'enso-walker-circulation',
    name: 'ENSO: Circulación de Walker Pacífico',
    startLat: 5.0,
    startLng: 150.0,
    endLat: 0.0,
    endLng: -90.0,
    color: ['#ff9100', '#00e5ff'],
    altitude: 0.38,
    stroke: 0.7,
    dashLength: 0.4,
    dashGap: 0.18,
    animateTime: 2500,
    description: 'Gradiente térmico zonal y acoplamiento océano-atmósfera del Pacífico ecuatorial.',
  },
  {
    id: 'antarctic-circumpolar',
    name: 'Corriente Circumpolar Antártica (ACC)',
    startLat: -58.0,
    startLng: -65.0,
    endLat: -50.0,
    endLng: 80.0,
    color: ['#8a2be2', '#00ffff'],
    altitude: 0.28,
    stroke: 0.6,
    dashLength: 0.35,
    dashGap: 0.2,
    animateTime: 3000,
    description: 'Barrera hidrodinámica más potente del planeta que aísla la masa de hielo antártica.',
  },
];

export function createEarthTeleconnectionArcs(globe: GlobeInstance) {
  let visible = true;
  let activeArcs: TeleconnectionArc[] = TELECONNECTION_PRESETS;

  const applyToGlobe = () => {
    globe
      .arcsData(visible ? activeArcs : [])
      .arcStartLat((d: object) => (d as TeleconnectionArc).startLat)
      .arcStartLng((d: object) => (d as TeleconnectionArc).startLng)
      .arcEndLat((d: object) => (d as TeleconnectionArc).endLat)
      .arcEndLng((d: object) => (d as TeleconnectionArc).endLng)
      .arcColor((d: object) => (d as TeleconnectionArc).color)
      .arcAltitude((d: object) => (d as TeleconnectionArc).altitude)
      .arcStroke((d: object) => (d as TeleconnectionArc).stroke)
      .arcDashLength((d: object) => (d as TeleconnectionArc).dashLength)
      .arcDashGap((d: object) => (d as TeleconnectionArc).dashGap)
      .arcDashAnimateTime((d: object) => (d as TeleconnectionArc).animateTime);
  };

  applyToGlobe();

  return {
    setVisible(nextVisible: boolean) {
      if (visible === nextVisible) return;
      visible = nextVisible;
      applyToGlobe();
    },
    setArcs(nextArcs: TeleconnectionArc[]) {
      activeArcs = nextArcs;
      applyToGlobe();
    },
    dispose() {
      globe.arcsData([]);
    },
  };
}
