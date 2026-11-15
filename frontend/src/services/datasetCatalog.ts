import type { ClimateVariable } from '../types/climate.types';
import type { DatasetCatalog, DatasetProvenance, ResolvedSource } from '../types/dataset.types';
import { VARIABLE_IDS } from '../config/climateLayers';
import { getJson } from './apiClient';

export type DataSourceMode = 'auto' | 'demo' | 'api';

/** A sleeping backend (free Render tier) must not leave Earth without data: fall back to demo after timeout. */
const CATALOG_TIMEOUT_MS = 6000;
/** Retry after failure, but not on every year change. */
const RETRY_AFTER_MS = 60_000;

let cached: { promise: Promise<DatasetCatalog>; failedAt: number | null } | null = null;

/** auto: API for variables with real datasets and demo for the rest. demo/api force a single source. */
export function readDataSourceMode(value: unknown, name: string): DataSourceMode {
  const mode = value ?? 'auto';
  if (mode !== 'auto' && mode !== 'demo' && mode !== 'api') throw new Error(`${name} must be auto, demo, or api.`);
  return mode;
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

async function fetchCatalog(): Promise<DatasetCatalog> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    return adaptDatasetCatalog(await getJson<unknown>('/datasets', undefined, { signal: controller.signal }));
  } finally {
    window.clearTimeout(timer);
  }
}

/** Never rejects: without an API, the catalog stays empty and everything falls back to the demo scenario. */
export function getDatasetCatalog(): Promise<DatasetCatalog> {
  if (cached && (cached.failedAt === null || Date.now() - cached.failedAt < RETRY_AFTER_MS)) return cached.promise;
  const entry: { promise: Promise<DatasetCatalog>; failedAt: number | null } = { promise: Promise.resolve(new Map()), failedAt: null };
  entry.promise = fetchCatalog().catch((error: unknown) => {
    entry.failedAt = Date.now();
    console.warn('Dataset catalog unavailable; falling back to demo scenario.', error);
    return new Map();
  });
  cached = entry;
  return entry.promise;
}

export async function resolveVariableSource(mode: DataSourceMode, variable: ClimateVariable): Promise<ResolvedSource> {
  if (mode === 'demo') return { source: 'demo', provenance: null };
  const provenance = (await getDatasetCatalog()).get(variable) ?? null;
  if (mode === 'api') return { source: 'api', provenance };
  return provenance ? { source: 'api', provenance } : { source: 'demo', provenance: null };
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
