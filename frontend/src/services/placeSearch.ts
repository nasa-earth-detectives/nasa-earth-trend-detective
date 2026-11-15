import type { SelectedLocation } from '../hooks/useImmersiveUi';
import type { Locale } from '../i18n/types';

export type PlaceKind = 'country' | 'state' | 'county' | 'city' | 'place';

/** A place found by name: a city, a department or state, a country. */
export interface Place {
  id: string;
  name: string;
  /** State, department or province the place belongs to, when it is not one itself. */
  state: string | null;
  country: string | null;
  countryCode: string | null;
  kind: PlaceKind;
  lat: number;
  lng: number;
  /** Box analysed for places wider than a single point (centre and half-sizes, degrees); null analyses the point. */
  box: { lat: number; lng: number; latRadius: number; lngRadius: number } | null;
}

/**
 * Places answered without the network, so the city this project was built in is found even with every
 * search service down. Their boxes were written by hand: Huila from its extent in OpenStreetMap,
 * Colombia as a rectangle around the mainland (4.2°S-12.5°N, 79°W-66.9°W).
 */
const KNOWN_PLACES: Place[] = [
  { id: 'known:neiva', name: 'Neiva', state: 'Huila', country: 'Colombia', countryCode: 'CO', kind: 'city', lat: 2.93, lng: -75.28, box: null },
  { id: 'known:huila', name: 'Huila', state: null, country: 'Colombia', countryCode: 'CO', kind: 'state', lat: 2.47, lng: -75.59,
    box: { lat: 2.7, lng: -75.52, latRadius: 1.14, lngRadius: 1.11 } },
  { id: 'known:colombia', name: 'Colombia', state: null, country: null, countryCode: 'CO', kind: 'country', lat: 4.1, lng: -72.9,
    box: { lat: 4.1, lng: -72.95, latRadius: 8.35, lngRadius: 6.05 } },
];

/**
 * Three open services, none of them needing a key; what is typed in the box is sent to the first two.
 *  - Open-Meteo (GeoNames data): cities and countries, fast and built for search-as-you-type.
 *  - Photon (komoot, OpenStreetMap data): also departments and states, each with its extent. Its
 *    public server stops answering under load, so it gets little patience and a rest after failing.
 *  - Nominatim (OpenStreetMap): asked once, when a country is chosen, for its extent. Its usage
 *    policy forbids search-as-you-type, so it is never called while typing.
 */
const OPEN_METEO = 'https://geocoding-api.open-meteo.com/v1/search';
const PHOTON = 'https://photon.komoot.io/api/';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const PHOTON_LAYERS = ['city', 'county', 'state', 'country'];
const PHOTON_PATIENCE_MS = 2500;
const PHOTON_REST_MS = 5 * 60_000;
const PATIENCE_MS = 6000;
const MAX_RESULTS = 7;
/** A point stands for the 2° around it: an extent no wider than that is analysed as a point. */
const POINT_HALF_SIZE = 1;
/**
 * Above these half-sizes the extent is not the place: countries with overseas territories, or that
 * cross the antimeridian, come with boxes as wide as an ocean. They are analysed at their centre.
 */
const MAX_HALF_HEIGHT = 35;
const MAX_HALF_WIDTH = 50;

const cache = new Map<string, Place[]>();
let photonRestsUntil = 0;

const plain = (value: string): string => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const identity = (place: Pick<Place, 'name' | 'state' | 'country'>): string =>
  `${plain(place.name)}|${plain(place.state ?? '')}|${plain(place.country ?? '')}`;
const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);

/** A request that gives up after `patienceMs`, or when the caller does. */
async function fetchJson(url: string, patienceMs: number, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  const timer = window.setTimeout(abort, patienceMs);
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Place search answered ${response.status}`);
    return await response.json() as unknown;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

/** West, north, east and south of an extent, as the box to analyse; null when a point says it better. */
function boxOf(extent: unknown): Place['box'] {
  if (!Array.isArray(extent) || extent.length !== 4 || !extent.every(item => typeof item === 'number' && Number.isFinite(item))) return null;
  const [west, north, east, south] = extent as number[];
  const latRadius = (north - south) / 2;
  const lngRadius = (east - west) / 2;
  const point = latRadius <= POINT_HALF_SIZE && lngRadius <= POINT_HALF_SIZE;
  if (point || latRadius <= 0 || lngRadius <= 0 || latRadius > MAX_HALF_HEIGHT || lngRadius > MAX_HALF_WIDTH) return null;
  // Narrower than the data grid in one direction: widened to the 2° of a point so it still holds a cell.
  return { lat: (north + south) / 2, lng: (east + west) / 2,
    latRadius: Math.max(POINT_HALF_SIZE, latRadius), lngRadius: Math.max(POINT_HALF_SIZE, lngRadius) };
}

const PHOTON_KINDS: Record<string, PlaceKind> = { country: 'country', state: 'state', county: 'county', city: 'city' };

function photonPlace(feature: unknown): Place | null {
  const row = (feature ?? {}) as { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };
  const coordinates = row.geometry?.coordinates;
  const properties = row.properties ?? {};
  const name = text(properties.name);
  if (!name || !Array.isArray(coordinates) || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') return null;
  const kind = PHOTON_KINDS[String(properties.type)] ?? 'place';
  return {
    id: `osm:${String(properties.osm_type)}${String(properties.osm_id)}`, name, kind,
    state: kind === 'state' || kind === 'country' ? null : text(properties.state),
    // A country comes with its own name as its country.
    country: kind === 'country' ? null : text(properties.country), countryCode: text(properties.countrycode),
    lat: coordinates[1], lng: coordinates[0], box: boxOf(properties.extent),
  };
}

/** Null when Photon did not answer in time; it is then left alone for a few minutes. */
async function photonPlaces(query: string, locale: Locale, signal: AbortSignal): Promise<Place[] | null> {
  if (Date.now() < photonRestsUntil) return null;
  const params = new URLSearchParams({ q: query, limit: '10' });
  // Photon knows English, German and French; any other language gets each place in its local name.
  if (locale === 'en') params.set('lang', 'en');
  PHOTON_LAYERS.forEach(layer => params.append('layer', layer));
  try {
    const payload = await fetchJson(`${PHOTON}?${params.toString()}`, PHOTON_PATIENCE_MS, signal) as { features?: unknown };
    return (Array.isArray(payload.features) ? payload.features : []).map(photonPlace).filter((place): place is Place => place !== null);
  } catch {
    if (!signal.aborted) photonRestsUntil = Date.now() + PHOTON_REST_MS;
    return null;
  }
}

function meteoPlace(entry: unknown): Place | null {
  const row = (entry ?? {}) as Record<string, unknown>;
  const name = text(row.name);
  const code = String(row.feature_code ?? '');
  // Populated places and countries; GeoNames also lists mountains and lakes under the same names.
  const kind: PlaceKind | null = code.startsWith('PCL') ? 'country' : code.startsWith('PPL') ? 'city' : null;
  if (!name || !kind || typeof row.latitude !== 'number' || typeof row.longitude !== 'number') return null;
  return {
    id: `geonames:${String(row.id)}`, name, kind, state: kind === 'city' ? text(row.admin1) : null,
    country: kind === 'country' ? null : text(row.country), countryCode: text(row.country_code),
    lat: row.latitude, lng: row.longitude, box: null,
  };
}

async function meteoPlaces(query: string, locale: Locale, signal: AbortSignal): Promise<Place[] | null> {
  const params = new URLSearchParams({ name: query, count: '10', language: locale, format: 'json' });
  try {
    const payload = await fetchJson(`${OPEN_METEO}?${params.toString()}`, PATIENCE_MS, signal) as { results?: unknown };
    return (Array.isArray(payload.results) ? payload.results : []).map(meteoPlace).filter((place): place is Place => place !== null);
  } catch {
    return null;
  }
}

/**
 * Places of the built-in list whose name, or the state they belong to, contains what was typed; those
 * whose own name starts with it come first, so "huila" offers the department before its capital.
 */
export function knownPlaces(query: string): Place[] {
  const wanted = plain(query);
  if (wanted.length < 2) return [];
  const named = (place: Place): boolean => plain(place.name).startsWith(wanted);
  return KNOWN_PLACES.filter(place => plain(`${place.name} ${place.state ?? ''}`).includes(wanted))
    .sort((a, b) => Number(named(b)) - Number(named(a)));
}

/**
 * Places matching what was typed: the built-in ones first, then those of the search services, without
 * repeats. Photon's answer is preferred when it arrives, because it brings extents; otherwise
 * Open-Meteo's. `remoteFailed` tells the box that only the built-in list answered.
 */
export async function searchPlaces(query: string, locale: Locale, signal: AbortSignal): Promise<{ places: Place[]; remoteFailed: boolean }> {
  const key = `${locale}:${plain(query)}`;
  let remote = cache.get(key) ?? null;
  if (!remote) {
    const [photon, meteo] = await Promise.all([photonPlaces(query, locale, signal), meteoPlaces(query, locale, signal)]);
    if (signal.aborted) throw new DOMException('Search aborted.', 'AbortError');
    remote = photon && photon.length > 0 ? photon : meteo;
    if (remote) cache.set(key, remote);
  }
  const seen = new Set<string>();
  const places = [...knownPlaces(query), ...(remote ?? [])].filter(place => {
    const id = identity(place);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return { places: places.slice(0, MAX_RESULTS), remoteFailed: remote === null };
}

/**
 * A country found through Open-Meteo comes as a point. Its extent is asked to Nominatim, once and
 * only because someone chose it; without an answer it stays a point at its centre.
 */
export async function withExtent(place: Place): Promise<Place> {
  if (place.kind !== 'country' || place.box !== null || !place.id.startsWith('geonames:')) return place;
  const params = new URLSearchParams({ country: place.name, format: 'jsonv2', limit: '1' });
  if (place.countryCode) params.set('countrycodes', place.countryCode.toLowerCase());
  try {
    const payload = await fetchJson(`${NOMINATIM}?${params.toString()}`, PATIENCE_MS);
    const first = (Array.isArray(payload) ? payload[0] : null) as { boundingbox?: unknown } | null;
    // Nominatim answers south, north, west, east, as text.
    const sides = Array.isArray(first?.boundingbox) ? first.boundingbox.map(Number) : [];
    return sides.length === 4 ? { ...place, box: boxOf([sides[2], sides[1], sides[3], sides[0]]) } : place;
  } catch {
    return place;
  }
}

/** "Neiva (Huila)": the name with the state or department it belongs to, unless both are called the same. */
export const placeLabel = (place: Place): string =>
  (place.state && plain(place.state) !== plain(place.name) ? `${place.name} (${place.state})` : place.name);

/** What the analysis and the globe take from a place: its box, or its point, and its name. */
export function placeLocation(place: Place): SelectedLocation {
  const placeName = place.country ? `${placeLabel(place)}, ${place.country}` : placeLabel(place);
  return place.box
    ? { lat: place.box.lat, lng: place.box.lng, latRadius: place.box.latRadius, lngRadius: place.box.lngRadius, placeName }
    : { lat: place.lat, lng: place.lng, placeName };
}
