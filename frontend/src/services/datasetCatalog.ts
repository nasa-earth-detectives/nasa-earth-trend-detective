import type { ClimateVariable } from '../types/climate.types';
import type { DatasetCatalog, DatasetProvenance, ResolvedSource } from '../types/dataset.types';
import { VARIABLE_IDS } from '../config/climateLayers';
import { getJson } from './apiClient';

/** One attempt may sit behind a host that is waking up: give it time before asking again. */
const CATALOG_TIMEOUT_MS = 20_000;
/** While the API is unreachable or still loading a variable, ask again this often. */
const RETRY_EVERY_MS = 4_000;
/** After this long without the variable, stop waiting and say so. */
const GIVE_UP_AFTER_MS = 180_000;

/**
 * What the app is waiting for. There is no simulated fallback any more: when the API cannot be
 * reached, or has not finished loading a dataset, the interface says so and keeps asking.
 */
export type DataConnection = 'idle' | 'connecting' | 'loading' | 'ready' | 'failed';

/** The API has no data for a variable. The interface reports it instead of drawing invented values. */
export class DataUnavailableError extends Error {
  constructor(readonly reason: 'unreachable' | 'not-loaded') {
    super(reason === 'unreachable'
      ? 'The data server did not answer. No simulated data is shown in its place.'
      : 'The data server has no dataset loaded for this variable.');
    this.name = 'DataUnavailableError';
  }
}

let connection: DataConnection = 'idle';
const listeners = new Set<() => void>();

function setConnection(next: DataConnection): void {
  if (next === connection) return;
  connection = next;
  listeners.forEach(listener => listener());
}

export const getDataConnection = (): DataConnection => connection;

export function subscribeDataConnection(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function text(row: Record<string, unknown>, field: string): string {
  const value = row[field];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Dataset catalog: missing ${field}.`);
  return value;
}

function number(row: Record<string, unknown>, field: string): number {
  const value = row[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Dataset catalog: invalid ${field}.`);
  return value;
}

/** Boundary of DatasetStatusDto: rejects incomplete provenance instead of displaying partial metadata. */
export function adaptDatasetCatalog(payload: unknown): DatasetCatalog {
  if (!Array.isArray(payload)) throw new Error('Dataset catalog must be a list.');
  const catalog = new Map<ClimateVariable, DatasetProvenance>();
  for (const entry of payload) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const code = row.code as ClimateVariable;
    if (!VARIABLE_IDS.includes(code) || row.status !== 'observed' || !row.provenance || typeof row.provenance !== 'object') continue;
    const p = row.provenance as Record<string, unknown>;
    catalog.set(code, {
      provider: text(p, 'provider'), product: text(p, 'product'), unit: text(p, 'unit'),
      trendUnit: text(p, 'trendUnit'), baseline: typeof p.baseline === 'string' ? p.baseline : null,
      resolutionDegrees: number(p, 'resolutionDegrees'), sourceUrl: text(p, 'sourceUrl'),
      coverageStart: number(p, 'coverageStart'), coverageEnd: number(p, 'coverageEnd'),
      lastMonth: text(p, 'lastMonth'), interim: p.interim === true, citation: text(p, 'citation'),
    });
  }
  return catalog;
}

/** Variables the API declares it will never have ("unavailable"): waiting for them is pointless. */
function readMissing(payload: unknown): ReadonlySet<string> {
  const missing = new Set<string>();
  if (!Array.isArray(payload)) return missing;
  for (const entry of payload) {
    const row = (entry ?? {}) as Record<string, unknown>;
    if (row.status === 'unavailable' && typeof row.code === 'string') missing.add(row.code);
  }
  return missing;
}

interface CatalogSnapshot {
  catalog: DatasetCatalog;
  missing: ReadonlySet<string>;
  reachable: boolean;
  complete: boolean;
  fetchedAt: number;
}

let latest: Promise<CatalogSnapshot> | null = null;

async function fetchSnapshot(): Promise<CatalogSnapshot> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    const payload = await getJson<unknown>('/datasets', undefined, { signal: controller.signal });
    const catalog = adaptDatasetCatalog(payload);
    return { catalog, missing: readMissing(payload), reachable: true,
      complete: VARIABLE_IDS.every(id => catalog.has(id)), fetchedAt: Date.now() };
  } catch (error) {
    console.warn('Dataset catalog not available yet; asking again shortly.', error);
    return { catalog: new Map(), missing: new Set(), reachable: false, complete: false, fetchedAt: Date.now() };
  } finally {
    window.clearTimeout(timer);
  }
}

/** A complete catalog is kept for the session; a partial or failed one is asked again once it is stale. */
function snapshot(): Promise<CatalogSnapshot> {
  const current = latest;
  if (!current) {
    latest = fetchSnapshot();
    return latest;
  }
  return current.then(value => {
    if (value.complete || Date.now() - value.fetchedAt < RETRY_EVERY_MS) return value;
    // Several callers can reach this point together: only the first one starts the new request.
    if (latest === current) latest = fetchSnapshot();
    return latest ?? value;
  });
}

/** Never rejects. Empty while the API is unreachable; partial while it is still loading datasets. */
export async function getDatasetCatalog(): Promise<DatasetCatalog> {
  return (await snapshot()).catalog;
}

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { window.clearTimeout(timer); reject(new DOMException('Query aborted.', 'AbortError')); };
    const timer = window.setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, milliseconds);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}

/**
 * Provenance of a variable, waiting for it if needed. A free host takes up to a minute to wake up and,
 * right after booting, can still be loading datasets: both are waited out with the interface saying what
 * is going on. If the variable never arrives the call rejects; nothing is drawn in its place.
 */
export async function resolveVariableSource(variable: ClimateVariable, signal?: AbortSignal): Promise<ResolvedSource> {
  const startedAt = Date.now();
  for (;;) {
    const current = await snapshot();
    const provenance = current.catalog.get(variable);
    if (provenance) {
      setConnection('ready');
      return { source: 'api', provenance };
    }
    if (current.missing.has(variable) || Date.now() - startedAt > GIVE_UP_AFTER_MS) {
      setConnection('failed');
      throw new DataUnavailableError(current.reachable ? 'not-loaded' : 'unreachable');
    }
    setConnection(current.reachable ? 'loading' : 'connecting');
    await wait(RETRY_EVERY_MS, signal);
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "through Aug" if the requested year is the dataset's final year and incomplete; otherwise null. */
export function partialYearNote(provenance: DatasetProvenance | null, year: number): string | null {
  const match = provenance && /^(\d{4})-(\d{2})$/.exec(provenance.lastMonth);
  if (!match || Number(match[1]) !== year || Number(match[2]) >= 12) return null;
  return `through ${MONTHS[Number(match[2]) - 1]}`;
}

/** Short provenance label for the UI. */
export function provenanceLabel(provenance: DatasetProvenance | null): string {
  if (!provenance) return 'Observations received from API';
  const product = provenance.product.split('·')[0].trim();
  return `${product} · ${provenance.interim ? 'interim source' : 'official source'}`;
}
