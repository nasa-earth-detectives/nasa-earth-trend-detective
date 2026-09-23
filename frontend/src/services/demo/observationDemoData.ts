import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import { HEX_GLOBAL_COVERAGE, HEX_GLOBAL_FLAGS } from './hexGlobalCoverage';

const RADIANS = Math.PI / 180;
const VARIABLES: readonly ClimateVariable[] = ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2'];
const demoCoverage = new WeakMap<ClimateObservation, number>();
export type ObservationCoverage = 'land' | 'global';

// Geometría estática compartida. Nunca se entregan referencias mutables de esta caché.
const locations = Array.from({ length: HEX_GLOBAL_COVERAGE.count }, (_, index) => ({
  id: `demo:observation:${index}`,
  latitude: Math.asin(1 - 2 * (index + 0.5) / HEX_GLOBAL_COVERAGE.count) / RADIANS,
  longitude: ((index * HEX_GLOBAL_COVERAGE.goldenAngleDegrees + 180) % 360) - 180,
  flags: Number(HEX_GLOBAL_FLAGS[index]),
}));

function validateContext(variable: ClimateVariable, year: number): void {
  if (!VARIABLES.includes(variable) || !Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError('La variable o el año de observación no son válidos.');
  }
}

/** Campo ficticio continuo sobre la esfera. No representa datos ni climatologías NASA. */
export function sampleDemoObservation(variable: ClimateVariable, year: number, latitude: number, longitude: number): ClimateObservation {
  validateContext(variable, year);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new RangeError('Las coordenadas de observación no son válidas.');
  }
  const lat = latitude * RADIANS;
  const lng = longitude * RADIANS;
  const x = Math.cos(lat) * Math.cos(lng);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.sin(lng);
  const time = year - 2002;
  const phase = VARIABLES.indexOf(variable) * 1.17 + time * 0.095;
  const field = 0.62 * Math.sin(3 * x + 2 * y + phase) * Math.cos(2 * z - phase * 0.3)
    + 0.38 * Math.sin(4 * z - y + phase * 0.7);
  const rounded = (value: number) => Number(value.toFixed(4));
  const common = { id: `demo:sample:${latitude.toFixed(7)}:${longitude.toFixed(7)}`, variable,
    latitude, longitude, timestamp: `${String(year).padStart(4, '0')}-07-01T00:00:00.000Z` };
  if (variable === 'Gistemp') {
    const anomaly = rounded(field * 1.6 + Math.sin(time * 0.045) * 0.25);
    return { ...common, value: anomaly, anomaly, unit: '°C' };
  }
  if (variable === 'GraceMass') {
    const anomaly = rounded(field * 26);
    return { ...common, value: anomaly, anomaly, unit: 'cm H₂O eq.' };
  }
  if (variable === 'ModisNdvi') return { ...common, value: rounded(Math.max(0, Math.min(1,
    0.46 + field * 0.34 + (1 - Math.abs(y)) * 0.13))), unit: 'NDVI' };
  return { ...common, value: rounded(395 + Math.sin(time * 0.055) * 22 + field * 12), unit: 'ppm' };
}

export function createDemoObservations(variable: ClimateVariable, year: number): ClimateObservation[] {
  validateContext(variable, year);
  return locations.filter(location => variable === 'ModisNdvi' ? location.flags === 3
    : variable === 'GraceMass' ? (location.flags & 1) !== 0 : true).map(location => {
    const observation = { ...sampleDemoObservation(variable, year, location.latitude, location.longitude), id: location.id };
    demoCoverage.set(observation, location.flags);
    return observation;
  });
}

/** Sólo aplica cartografía demo a objetos demo. La API requiere su propia cobertura declarada. */
export function filterObservationCoverage(observations: ClimateObservation[], coverage: ObservationCoverage): ClimateObservation[] {
  return coverage === 'global' ? observations : observations.filter(observation => {
    const flags = demoCoverage.get(observation);
    return flags === undefined || (flags & 1) !== 0;
  });
}
