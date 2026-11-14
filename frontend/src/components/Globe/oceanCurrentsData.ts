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
 * Scientific catalog of Earth's major ocean currents.
 * Based on NASA oceanographic datasets (ECCO v4 and OSCAR).
 */
export const OCEAN_CURRENTS: OceanCurrentPath[] = [
  {
    id: 'gulf-stream',
    name: 'Gulf Stream & North Atlantic Drift',
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
    description: 'Meridional heat pump transporting thermal energy into the North Atlantic.',
  },
  {
    id: 'kuroshio',
    name: 'Kuroshio Current (Japan)',
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
    description: 'Western Pacific subtropical gyre warming the Asian coast.',
  },
  {
    id: 'antarctic-circumpolar-1',
    name: 'Antarctic Circumpolar Current (Atlantic-Indian Sector)',
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
    description: "The planet's largest water flow, thermally isolating the Antarctic cryosphere.",
  },
  {
    id: 'antarctic-circumpolar-2',
    name: 'Antarctic Circumpolar Current (Pacific Sector)',
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
    description: 'Unbroken west-to-east circumpolar circulation.',
  },
  {
    id: 'humboldt-peru',
    name: 'Humboldt / Peru Current',
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
    description: 'Cold nutrient-rich marine upwelling; key modulator of ENSO.',
  },
  {
    id: 'agulhas-current',
    name: 'Agulhas Current',
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
    description: 'Fast Indian Ocean current injecting salty eddies into the Atlantic.',
  },
  {
    id: 'california-current',
    name: 'California Current',
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
    description: 'Equatorward cold flow along the Northeast Pacific basin.',
  },
  {
    id: 'benguela-current',
    name: 'Benguela Current',
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
    description: 'Cold coastal upwelling in the Southeast Atlantic off Namibia and South Africa.',
  },
  {
    id: 'north-equatorial-pac',
    name: 'North Equatorial Current (Pacific)',
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
    description: 'Persistent wind-driven flow driven by northeast trade winds.',
  },
];
