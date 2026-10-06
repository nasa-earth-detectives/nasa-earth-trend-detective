import type { Teleconnection, TeleconnectionEndpoint } from '../types/teleconnection.types';
import { getJson } from './apiClient';

/** Paleta de la escena: un color por variable del par y dos para procesos físicos. */
const VARIABLE_COLORS: Record<number | string, string> = {
  1: '#fb923c', Gistemp: '#fb923c',
  2: '#4ade80', ModisNdvi: '#4ade80',
  3: '#e879f9', GraceMass: '#e879f9',
  4: '#fde047', Oco2: '#fde047',
};

/**
 * Procesos físicos que no son pares de la API: se dibujan como contexto y se marcan 'local'.
 * Las coordenadas son representativas de cada región, no un cálculo.
 */
const PHYSICAL: Teleconnection[] = [
  { id: 'enso-walker', name: 'ENSO · circulación de Walker del Pacífico', color: '#22d3ee', altitude: 0.32, source: 'local',
    from: { label: 'Pacífico occidental', lat: 2, lng: 150 }, to: { label: 'Pacífico oriental', lat: -2, lng: -95 } },
  { id: 'sahara-amazon', name: 'Polvo del Sahara que fertiliza la Amazonía', color: '#fbbf24', altitude: 0.26, source: 'local',
    from: { label: 'Depresión de Bodélé (Chad)', lat: 17, lng: 18 }, to: { label: 'Cuenca amazónica', lat: -3.5, lng: -62 } },
];

/** Copia de las regiones de OpposingTrendsService para cuando la API no responde. */
const FALLBACK_PAIRS: Teleconnection[] = [
  { id: 'arctic-atlantic-thermal', name: 'Amplificación ártica vs. Atlántico Norte subpolar', color: VARIABLE_COLORS.Gistemp,
    altitude: 0.22, source: 'local',
    from: { label: 'Atlántico Norte Subpolar', lat: 55, lng: -30 }, to: { label: 'Ártico (Svalbard)', lat: 78.22, lng: 15.63 } },
  { id: 'amazon-china-ndvi', name: 'Reverdecimiento en China vs. estrés en la Amazonía', color: VARIABLE_COLORS.ModisNdvi,
    altitude: 0.42, source: 'local',
    from: { label: 'Cuenca Amazónica', lat: -3.46, lng: -62.21 }, to: { label: 'Sur de China', lat: 25, lng: 115 } },
  { id: 'polar-ice-divergence', name: 'Masa de hielo: Groenlandia vs. Antártida oriental', color: VARIABLE_COLORS.GraceMass,
    altitude: 0.5, source: 'local',
    from: { label: 'Manto de Groenlandia', lat: 72, lng: -40 }, to: { label: 'Meseta Antártica Oriental', lat: -75, lng: 100 } },
];

function endpoint(region: unknown): TeleconnectionEndpoint | null {
  if (!region || typeof region !== 'object') return null;
  const r = region as Record<string, unknown>;
  const lat = r.latitude; const lng = r.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: typeof r.regionName === 'string' ? r.regionName : 'Región', lat, lng };
}

/** Frontera del DTO OpposingTrendPair: descarta pares incompletos en vez de dibujar coordenadas basura. */
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

/** Pares de la API + procesos físicos. Nunca rechaza: sin API usa la copia local de las regiones. */
export function getTeleconnections(): Promise<Teleconnection[]> {
  cached ??= getJson<unknown>('/trends/opposing')
    .then(adaptOpposingPairs)
    .then((pairs) => (pairs.length ? pairs : FALLBACK_PAIRS))
    .catch(() => { cached = null; return FALLBACK_PAIRS; })
    .then((pairs) => [...pairs, ...PHYSICAL]);
  return cached;
}
