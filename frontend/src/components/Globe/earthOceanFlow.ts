import type { GlobeInstance } from 'globe.gl';

export interface OceanCurrentPath {
  id: string;
  name: string;
  temperature: 'warm' | 'cold' | 'neutral';
  coords: Array<[number, number]>; // [lat, lng]
  color: string;
  stroke: number;
  dashLength: number;
  dashGap: number;
  animateTime: number;
  description: string;
}

/**
 * Catálogo científico de corrientes oceánicas mayores de la Tierra.
 * Basado en datos oceanográficos de la NASA (ECCO v4 y OSCAR).
 */
export const OCEAN_CURRENTS: OceanCurrentPath[] = [
  {
    id: 'gulf-stream',
    name: 'Corriente del Golfo & Deriva Noratlántica',
    temperature: 'warm',
    coords: [
      [24.0, -80.0], [28.0, -79.0], [32.0, -76.0], [36.0, -72.0],
      [40.0, -60.0], [44.0, -45.0], [50.0, -28.0], [56.0, -15.0],
      [62.0, 0.0], [68.0, 12.0], [71.0, 25.0],
    ],
    color: '#ff9500',
    stroke: 1.4,
    dashLength: 0.18,
    dashGap: 0.04,
    animateTime: 2800,
    description: 'Bomba térmica meridional que transporta calor hacia el Atlántico Norte.',
  },
  {
    id: 'kuroshio',
    name: 'Corriente de Kuroshio (Japón)',
    temperature: 'warm',
    coords: [
      [18.0, 122.0], [24.0, 125.0], [30.0, 131.0], [35.0, 141.0],
      [38.0, 150.0], [40.0, 165.0], [42.0, 180.0], [43.0, -165.0],
    ],
    color: '#ff5533',
    stroke: 1.3,
    dashLength: 0.2,
    dashGap: 0.04,
    animateTime: 2600,
    description: 'Giro subtropical del Pacífico Occidental que calienta la costa asiática.',
  },
  {
    id: 'antarctic-circumpolar-1',
    name: 'Corriente Circumpolar Antártica (Sector Atlántico-Índico)',
    temperature: 'cold',
    coords: [
      [-56.0, -65.0], [-53.0, -40.0], [-51.0, -15.0], [-52.0, 10.0],
      [-51.0, 35.0], [-53.0, 65.0], [-52.0, 95.0], [-54.0, 120.0],
    ],
    color: '#00e5ff',
    stroke: 1.5,
    dashLength: 0.16,
    dashGap: 0.04,
    animateTime: 3200,
    description: 'El mayor flujo hídrico del planeta, aislando la criosfera antártica.',
  },
  {
    id: 'antarctic-circumpolar-2',
    name: 'Corriente Circumpolar Antártica (Sector Pacífico)',
    temperature: 'cold',
    coords: [
      [-54.0, 120.0], [-55.0, 145.0], [-56.0, 175.0], [-57.0, -155.0],
      [-58.0, -125.0], [-59.0, -95.0], [-57.0, -75.0], [-56.0, -65.0],
    ],
    color: '#00c3ff',
    stroke: 1.5,
    dashLength: 0.16,
    dashGap: 0.04,
    animateTime: 3200,
    description: 'Circulación circumpolar ininterrumpida de oeste a este.',
  },
  {
    id: 'humboldt-peru',
    name: 'Corriente de Humboldt / Perú',
    temperature: 'cold',
    coords: [
      [-45.0, -76.0], [-35.0, -74.0], [-25.0, -72.0], [-15.0, -76.0],
      [-6.0, -82.0], [0.0, -90.0], [2.0, -100.0],
    ],
    color: '#00f0ff',
    stroke: 1.3,
    dashLength: 0.22,
    dashGap: 0.05,
    animateTime: 2900,
    description: 'Surgencia marina fría rica en nutrientes; modulador clave de ENSO.',
  },
  {
    id: 'agulhas-current',
    name: 'Corriente de las Agujas (Agulhas)',
    temperature: 'warm',
    coords: [
      [-15.0, 42.0], [-24.0, 36.0], [-30.0, 32.0], [-34.0, 26.0],
      [-37.0, 19.0], [-36.0, 14.0],
    ],
    color: '#ff7700',
    stroke: 1.2,
    dashLength: 0.22,
    dashGap: 0.05,
    animateTime: 2400,
    description: 'Corriente rápida del océano Índico que inyecta anillos salinos al Atlántico.',
  },
  {
    id: 'california-current',
    name: 'Corriente de California',
    temperature: 'cold',
    coords: [
      [48.0, -128.0], [40.0, -126.0], [33.0, -122.0], [25.0, -117.0],
      [20.0, -112.0],
    ],
    color: '#38bdf8',
    stroke: 1.2,
    dashLength: 0.25,
    dashGap: 0.05,
    animateTime: 3000,
    description: 'Flujo frío hacia el ecuador en la cuenca del Pacífico Nororiental.',
  },
  {
    id: 'benguela-current',
    name: 'Corriente de Benguela',
    temperature: 'cold',
    coords: [
      [-35.0, 18.0], [-28.0, 14.0], [-20.0, 11.0], [-12.0, 8.0],
      [-4.0, 3.0],
    ],
    color: '#38bdf8',
    stroke: 1.2,
    dashLength: 0.25,
    dashGap: 0.05,
    animateTime: 3000,
    description: 'Surgencia costera fría del Atlántico Suroriental frente a Namibia y Sudáfrica.',
  },
  {
    id: 'north-equatorial-pac',
    name: 'Corriente Ecuatorial del Norte (Pacífico)',
    temperature: 'warm',
    coords: [
      [12.0, -110.0], [13.0, -135.0], [14.0, -160.0], [14.0, 175.0],
      [15.0, 150.0], [15.0, 130.0],
    ],
    color: '#facc15',
    stroke: 1.2,
    dashLength: 0.2,
    dashGap: 0.04,
    animateTime: 3400,
    description: 'Arrastre eólico constante de los vientos alisios del noreste.',
  },
];

export function createEarthOceanFlow(globe: GlobeInstance) {
  let visible = true;
  let activePaths: OceanCurrentPath[] = OCEAN_CURRENTS;

  const applyToGlobe = () => {
    globe
      .pathsData(visible ? activePaths : [])
      .pathPoints((d: object) => (d as OceanCurrentPath).coords)
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
