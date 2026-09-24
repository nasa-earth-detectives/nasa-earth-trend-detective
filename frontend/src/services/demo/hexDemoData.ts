import type { ClimateVariable } from '../../types/climate.types';
import type { HexDataset } from '../../types/hex.types';
import type { TrendFilterParams } from '../../types/trend.types';
import { DEMO_LAND_CELL_IDS } from './hexDemoCoverage';
import { HEX_GLOBAL_COVERAGE, HEX_GLOBAL_FLAGS } from './hexGlobalCoverage';

/** Escalas de presentación del escenario ficticio, no umbrales científicos. */
export const HEX_VARIABLE_PROFILES: Record<ClimateVariable, { unit: string; heightDomain: number }> = {
  Gistemp: { unit: '°C / año', heightDomain: 0.08 },
  ModisNdvi: { unit: 'NDVI / año', heightDomain: 0.015 },
  GraceMass: { unit: 'cm H₂O eq. / año', heightDomain: 3 },
  Oco2: { unit: 'ppm / año', heightDomain: 4 },
};

export const DEMO_HEX_RESOLUTION_DEGREES = 2.2;
const PATCH_RADIUS = 5;
const RADIANS = Math.PI / 180;
const REGIONS = [
  { id: 'north-america', latitude: 36, longitude: -106 },
  { id: 'south-america', latitude: -13, longitude: -62 },
  { id: 'europe', latitude: 48, longitude: 17 },
  { id: 'north-africa', latitude: 18, longitude: 19 },
  { id: 'asia', latitude: 38, longitude: 101 },
  { id: 'australia', latitude: -24, longitude: 134 },
  { id: 'pacific', latitude: 8, longitude: -146 },
  { id: 'greenland', latitude: 65, longitude: -42 },
] as const;
const VARIABLES: ClimateVariable[] = ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2'];
const landCellIds = new Set<string>(DEMO_LAND_CELL_IDS);
export type HexDemoProfile = 'global' | 'regional' | 'stress';

/** Ensayo reproducible: las 6.211 celdas están en el hemisferio del encuadre inicial. */
export const HEX_STRESS_PROFILE = { radius: 45, resolutionDegrees: 0.75, latitude: 18, longitude: -12 } as const;

/** Proyección geodésica del plano tangente: mantiene el espaciado incluso cerca de Groenlandia. */
function projectCenter(latitude: number, longitude: number, east: number, north: number) {
  const distance = Math.hypot(east, north) * RADIANS;
  if (distance === 0) return { latitude, longitude };
  const bearing = Math.atan2(east, north);
  const lat = latitude * RADIANS;
  const nextLat = Math.asin(Math.sin(lat) * Math.cos(distance)
    + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing));
  const nextLng = longitude * RADIANS + Math.atan2(
    Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
    Math.cos(distance) - Math.sin(lat) * Math.sin(nextLat),
  );
  return { latitude: nextLat / RADIANS, longitude: ((nextLng / RADIANS + 540) % 360) - 180 };
}

interface DemoLocation {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly regionIndex: number;
  readonly qPhase: number;
  readonly rPhase: number;
  readonly envelope: number;
}

// Dos geometrías base. Se conservan centros y factores espaciales,
// nunca los objetos mutables que se entregan al consumidor de cada consulta.
const locationCache = new Map<HexDemoProfile, readonly DemoLocation[]>();

interface GlobalLocation {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly flags: number;
}
let globalLocations: readonly GlobalLocation[] | null = null;

/** Muestreo de área casi uniforme: no acumula miles de columnas en los polos. */
function getGlobalLocations(): readonly GlobalLocation[] {
  if (globalLocations) return globalLocations;
  globalLocations = Array.from({ length: HEX_GLOBAL_COVERAGE.count }, (_, index) => {
    const y = 1 - 2 * (index + 0.5) / HEX_GLOBAL_COVERAGE.count;
    const latitude = Math.asin(y) / RADIANS;
    const longitude = ((index * HEX_GLOBAL_COVERAGE.goldenAngleDegrees + 180) % 360) - 180;
    const cosLatitude = Math.sqrt(1 - y * y);
    return { id: `demo:global:${index}`, latitude, longitude, y,
      x: cosLatitude * Math.cos(longitude * RADIANS), z: cosLatitude * Math.sin(longitude * RADIANS),
      flags: Number(HEX_GLOBAL_FLAGS[index]) };
  });
  return globalLocations;
}

function createGlobalDataset(filter: TrendFilterParams): HexDataset {
  const profile = HEX_VARIABLE_PROFILES[filter.variable];
  const variableIndex = VARIABLES.indexOf(filter.variable);
  const phase = variableIndex * 1.17 + (filter.startYear - 2002) * 0.021 + (filter.endYear - 2002) * 0.047;
  const locations = getGlobalLocations().filter(location => filter.variable === 'ModisNdvi'
    ? location.flags === 3 : filter.variable === 'GraceMass' ? (location.flags & 1) !== 0 : true);
  const cells = locations.map(({ id, latitude, longitude, x, y, z }) => {
    // Campo sintético continuo sobre la esfera, sin saltos en ±180° ni fronteras políticas.
    const field = 0.62 * Math.sin(3 * x + 2 * y + phase) * Math.cos(2 * z - phase * 0.3)
      + 0.38 * Math.sin(4 * z - y + phase * 0.7);
    return { id, latitude, longitude, slope: Number((field * 0.55 * profile.heightDomain).toFixed(7)) };
  });
  return { cells, variable: filter.variable, startYear: filter.startYear, endYear: filter.endYear,
    source: 'demo', unit: profile.unit, heightDomain: profile.heightDomain,
    resolutionDegrees: HEX_GLOBAL_COVERAGE.resolutionDegrees };
}

function getLocations(demoProfile: HexDemoProfile): readonly DemoLocation[] {
  const cached = locationCache.get(demoProfile);
  if (cached) return cached;
  const stress = demoProfile === 'stress';
  const patchRadius = stress ? HEX_STRESS_PROFILE.radius : PATCH_RADIUS;
  const resolutionDegrees = stress ? HEX_STRESS_PROFILE.resolutionDegrees : DEMO_HEX_RESOLUTION_DEGREES;
  const regions = stress ? [{ id: 'stress', latitude: HEX_STRESS_PROFILE.latitude, longitude: HEX_STRESS_PROFILE.longitude }] : REGIONS;
  const locations = regions.flatMap((region, regionIndex) => {
    const patch: DemoLocation[] = [];
    for (let q = -patchRadius; q <= patchRadius; q += 1) {
      for (let r = -patchRadius; r <= patchRadius; r += 1) {
        if (Math.abs(q + r) > patchRadius) continue;
        const east = resolutionDegrees * (q + r / 2);
        const north = resolutionDegrees * Math.sqrt(3) / 2 * r;
        // El ensayo denso limita la altura para evitar que columnas delanteras oculten a las demás.
        const envelope = stress ? 0.3 : 0.38 + 0.52 * Math.exp(-(q * q + r * r + q * r) / 28);
        patch.push({
          id: `demo:${region.id}:${q}:${r}`,
          ...projectCenter(region.latitude, region.longitude, east, north),
          regionIndex,
          qPhase: q * 0.27,
          rPhase: r * 0.19,
          envelope,
        });
      }
    }
    return patch;
  });
  locationCache.set(demoProfile, locations);
  return locations;
}

/** Global por defecto; regional conserva la comparación y stress sirve sólo para medir carga. */
export function createDemoHexDataset(filter: TrendFilterParams, demoProfile: HexDemoProfile = 'global'): HexDataset {
  if (demoProfile === 'global') return createGlobalDataset(filter);
  const profile = HEX_VARIABLE_PROFILES[filter.variable];
  const variableIndex = VARIABLES.indexOf(filter.variable);
  const periodPhase = (filter.startYear - 2002) * 0.043 + (filter.endYear - 2002) * 0.067;
  const phases = REGIONS.map((_, index) => index * 1.31 + variableIndex * 0.89 + periodPhase);
  const regionalLandOnly = demoProfile === 'regional' && (filter.variable === 'ModisNdvi' || filter.variable === 'GraceMass');
  const locations = regionalLandOnly ? getLocations(demoProfile).filter(location => landCellIds.has(location.id)
    && (filter.variable !== 'ModisNdvi' || !location.id.startsWith('demo:greenland:'))) : getLocations(demoProfile);
  const cells = locations.map(location => {
    const wave = Math.sin(phases[location.regionIndex] + location.qPhase + location.rPhase);
    return {
      id: location.id,
      latitude: location.latitude,
      longitude: location.longitude,
      slope: Number((wave * location.envelope * profile.heightDomain).toFixed(7)),
    };
  });
  return {
    cells,
    variable: filter.variable,
    startYear: filter.startYear,
    endYear: filter.endYear,
    source: 'demo',
    unit: profile.unit,
    heightDomain: profile.heightDomain,
    resolutionDegrees: demoProfile === 'stress' ? HEX_STRESS_PROFILE.resolutionDegrees : DEMO_HEX_RESOLUTION_DEGREES,
  };
}
