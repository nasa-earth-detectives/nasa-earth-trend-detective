import type { ClimateVariable } from '../types/climate.types';
import type { DatasetCatalog, DatasetProvenance, ResolvedSource } from '../types/dataset.types';
import { getJson } from './apiClient';

export type DataSourceMode = 'auto' | 'demo' | 'api';

const VARIABLES: readonly ClimateVariable[] = ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2'];
/** Un backend dormido (Render gratuito) no debe dejar la Tierra sin datos: pasado esto, demo. */
const CATALOG_TIMEOUT_MS = 6000;
/** Tras un fallo se reintenta, pero no en cada cambio de año. */
const RETRY_AFTER_MS = 60_000;

let cached: { promise: Promise<DatasetCatalog>; failedAt: number | null } | null = null;

/** auto: API para las variables con dataset real y demo para el resto. demo/api fuerzan una fuente. */
export function readDataSourceMode(value: unknown, name: string): DataSourceMode {
  const mode = value ?? 'auto';
  if (mode !== 'auto' && mode !== 'demo' && mode !== 'api') throw new Error(`${name} debe ser auto, demo o api.`);
  return mode;
}

function text(row: Record<string, unknown>, field: string): string {
  const value = row[field];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Catálogo de datasets: falta ${field}.`);
  return value;
}

function number(row: Record<string, unknown>, field: string): number {
  const value = row[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Catálogo de datasets: ${field} inválido.`);
  return value;
}

/** Frontera del DTO DatasetStatusDto: rechaza procedencias incompletas en vez de mostrarlas a medias. */
export function adaptDatasetCatalog(payload: unknown): DatasetCatalog {
  if (!Array.isArray(payload)) throw new Error('El catálogo de datasets debe ser una lista.');
  const catalog = new Map<ClimateVariable, DatasetProvenance>();
  for (const entry of payload) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const code = row.code as ClimateVariable;
    if (!VARIABLES.includes(code) || row.status !== 'observed' || !row.provenance || typeof row.provenance !== 'object') continue;
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

/** Nunca rechaza: sin API, el catálogo queda vacío y todo cae al escenario de demostración. */
export function getDatasetCatalog(): Promise<DatasetCatalog> {
  if (cached && (cached.failedAt === null || Date.now() - cached.failedAt < RETRY_AFTER_MS)) return cached.promise;
  const entry: { promise: Promise<DatasetCatalog>; failedAt: number | null } = { promise: Promise.resolve(new Map()), failedAt: null };
  entry.promise = fetchCatalog().catch((error: unknown) => {
    entry.failedAt = Date.now();
    console.warn('Catálogo de datasets no disponible; se usa el escenario de demostración.', error);
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

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "hasta ago" si el año pedido es el último del dataset y no está completo; si no, null. */
export function partialYearNote(provenance: DatasetProvenance | null, year: number): string | null {
  const match = provenance && /^(\d{4})-(\d{2})$/.exec(provenance.lastMonth);
  if (!match || Number(match[1]) !== year || Number(match[2]) >= 12) return null;
  return `hasta ${MONTHS[Number(match[2]) - 1]}`;
}

/** Rótulo corto de procedencia para la interfaz. */
export function provenanceLabel(provenance: DatasetProvenance | null): string {
  if (!provenance) return 'Observaciones recibidas de la API';
  const product = provenance.product.split('·')[0].trim();
  return `${product} · ${provenance.interim ? 'fuente provisional' : 'fuente oficial'}`;
}
