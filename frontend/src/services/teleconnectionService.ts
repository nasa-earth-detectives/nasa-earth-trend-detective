import type { Teleconnection, TeleconnectionEndpoint } from '../types/teleconnection.types';
import type { ClimateVariable } from '../types/climate.types';
import { SCIENCE_ACCENTS } from '../config/scienceTheme';
import { getJson } from './apiClient';

/** IDs from backend/.../Enums/ClimateVariable.cs: the API may send the variable as a number or string. */
const VARIABLE_BY_ID: Record<number, ClimateVariable> = {
  1: 'Gistemp', 2: 'ModisNdvi', 3: 'GraceMass', 4: 'Oco2',
  5: 'Merra2Temperature', 6: 'Merra2Precipitation', 7: 'Merra2Evaporation', 8: 'Merra2SoilMoisture',
  9: 'GpmPrecipitation',
};
const NEUTRAL_ARC = '#aaa99d';

/** Each arc uses its variable's accent color: the same color used across the rest of the instrument. */
function arcColor(variable: unknown): string {
  const code = typeof variable === 'number' ? VARIABLE_BY_ID[variable] : variable as ClimateVariable;
  return SCIENCE_ACCENTS[code]?.accent ?? NEUTRAL_ARC;
}

/**
 * Physical processes that are not API pairs: drawn as context and marked 'local'.
 * Coordinates are representative of each region, not a calculation.
 */
const PHYSICAL: Teleconnection[] = [
  { id: 'enso-walker', name: 'ENSO · Pacific Walker Circulation', color: '#9dc0d2', altitude: 0.32, source: 'local',
    from: { label: 'Western Pacific', lat: 2, lng: 150 }, to: { label: 'Eastern Pacific', lat: -2, lng: -95 } },
  { id: 'sahara-amazon', name: 'Sahara dust fertilizing the Amazon', color: '#bda778', altitude: 0.26, source: 'local',
    from: { label: 'Bodélé Depression (Chad)', lat: 17, lng: 18 }, to: { label: 'Amazon Basin', lat: -3.5, lng: -62 } },
];

function endpoint(region: unknown): TeleconnectionEndpoint | null {
  if (!region || typeof region !== 'object') return null;
  const r = region as Record<string, unknown>;
  const lat = r.latitude; const lng = r.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: typeof r.regionName === 'string' ? r.regionName : 'Region', lat, lng };
}

/** Boundary of OpposingTrendPair DTO: discards incomplete pairs instead of drawing bogus coordinates. */
export function adaptOpposingPairs(payload: unknown): Teleconnection[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((entry: unknown): Teleconnection[] => {
    const row = (entry ?? {}) as Record<string, unknown>;
    const from = endpoint(row.decreasingRegion);
    const to = endpoint(row.increasingRegion);
    if (!from || !to || typeof row.pairId !== 'string') return [];
    const variable = (row.increasingRegion as Record<string, unknown>).variable;
    const distance = Math.acos(Math.max(-1, Math.min(1, Math.sin(from.lat * Math.PI / 180) * Math.sin(to.lat * Math.PI / 180)
      + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.cos((to.lng - from.lng) * Math.PI / 180))));
    return [{ id: row.pairId, name: typeof row.driverProcess === 'string' ? row.driverProcess : row.pairId,
      from, to, color: arcColor(variable), altitude: 0.12 + 0.13 * distance, source: 'api' }];
  });
}

let cached: Promise<Teleconnection[]> | null = null;

/**
 * Opposing trend pairs from API + physical context processes. Never rejects. Without an API there
 * are no pairs: previously a local copy of made-up regions was drawn, presenting uncomputed data
 * as a real result.
 */
export function getTeleconnections(): Promise<Teleconnection[]> {
  cached ??= getJson<unknown>('/trends/opposing')
    .then(adaptOpposingPairs)
    .catch((): Teleconnection[] => { cached = null; return []; })
    .then((pairs) => [...pairs, ...PHYSICAL]);
  return cached;
}
