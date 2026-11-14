import type { Teleconnection, TeleconnectionEndpoint } from '../types/teleconnection.types';
import { getJson } from './apiClient';

/** Scene palette: one color per variable in the pair and two for physical processes. */
const VARIABLE_COLORS: Record<number | string, string> = {
  1: '#fb923c', Gistemp: '#fb923c',
  2: '#4ade80', ModisNdvi: '#4ade80',
  3: '#e879f9', GraceMass: '#e879f9',
  4: '#fde047', Oco2: '#fde047',
};

/**
 * Physical processes that are not API pairs: drawn as context and marked 'local'.
 * Coordinates represent each region rather than a calculated point.
 */
const PHYSICAL: Teleconnection[] = [
  { id: 'enso-walker', name: 'ENSO · Pacific Walker Circulation', color: '#22d3ee', altitude: 0.32, source: 'local',
    from: { label: 'Western Pacific', lat: 2, lng: 150 }, to: { label: 'Eastern Pacific', lat: -2, lng: -95 } },
  { id: 'sahara-amazon', name: 'Saharan Dust Fertilizing the Amazon', color: '#fbbf24', altitude: 0.26, source: 'local',
    from: { label: 'Bodélé Depression (Chad)', lat: 17, lng: 18 }, to: { label: 'Amazon Basin', lat: -3.5, lng: -62 } },
];

/** Copy of OpposingTrendsService regions for when the API does not respond. */
const FALLBACK_PAIRS: Teleconnection[] = [
  { id: 'arctic-atlantic-thermal', name: 'Arctic Amplification vs. Subpolar North Atlantic', color: VARIABLE_COLORS.Gistemp,
    altitude: 0.22, source: 'local',
    from: { label: 'Subpolar North Atlantic', lat: 55, lng: -30 }, to: { label: 'Arctic (Svalbard)', lat: 78.22, lng: 15.63 } },
  { id: 'amazon-china-ndvi', name: 'Greening in China vs. Stress in the Amazon', color: VARIABLE_COLORS.ModisNdvi,
    altitude: 0.42, source: 'local',
    from: { label: 'Amazon Basin', lat: -3.46, lng: -62.21 }, to: { label: 'Southern China', lat: 25, lng: 115 } },
  { id: 'polar-ice-divergence', name: 'Ice Mass: Greenland vs. East Antarctica', color: VARIABLE_COLORS.GraceMass,
    altitude: 0.5, source: 'local',
    from: { label: 'Greenland Ice Sheet', lat: 72, lng: -40 }, to: { label: 'East Antarctic Plateau', lat: -75, lng: 100 } },
];

function endpoint(region: unknown): TeleconnectionEndpoint | null {
  if (!region || typeof region !== 'object') return null;
  const r = region as Record<string, unknown>;
  const lat = r.latitude; const lng = r.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: typeof r.regionName === 'string' ? r.regionName : 'Region', lat, lng };
}

/** Boundary of OpposingTrendPair DTO: discards incomplete pairs instead of rendering bogus coordinates. */
export function adaptOpposingPairs(payload: unknown): Teleconnection[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((entry: unknown): Teleconnection[] => {
    const row = (entry ?? {}) as Record<string, unknown>;
    const from = endpoint(row.decreasingRegion);
    const to = endpoint(row.increasingRegion);
    if (!from || !to || typeof row.pairId !== 'string') return [];
    const variable = (row.increasingRegion as Record<string, unknown>).variable as number | string;
    const distance = Math.acos(Math.max(-1, Math.min(1, Math.sin(from.lat * Math.PI / 180) * Math.sin(to.lat * Math.PI / 180)
      + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.cos((to.lng - from.lng) * Math.PI / 180))));
    return [{ id: row.pairId, name: typeof row.driverProcess === 'string' ? row.driverProcess : row.pairId,
      from, to, color: VARIABLE_COLORS[variable] ?? '#22d3ee', altitude: 0.12 + 0.13 * distance, source: 'api' }];
  });
}

let cached: Promise<Teleconnection[]> | null = null;

/** API pairs + physical processes. Never rejects: without API, uses local fallback regions. */
export function getTeleconnections(): Promise<Teleconnection[]> {
  cached ??= getJson<unknown>('/trends/opposing')
    .then(adaptOpposingPairs)
    .then((pairs) => (pairs.length ? pairs : FALLBACK_PAIRS))
    .catch(() => { cached = null; return FALLBACK_PAIRS; })
    .then((pairs) => [...pairs, ...PHYSICAL]);
  return cached;
}
