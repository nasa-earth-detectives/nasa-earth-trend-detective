import type { HexCell, HexDataset } from '../types/hex.types';
import type { ClimateVariable } from '../types/climate.types';
import type { TrendFilterParams } from '../types/trend.types';
import { createDemoHexDataset, HEX_VARIABLE_PROFILES } from './demo/hexDemoData';
import { readDataSourceMode, resolveVariableSource } from './datasetCatalog';
import { trendService } from './trendService';

/** Explicit correspondence with backend/.../Enums/ClimateVariable.cs, without assuming JSON strings. */
const API_VARIABLE_IDS: Record<ClimateVariable, number> = { Gistemp: 1, ModisNdvi: 2, GraceMass: 3, Oco2: 4 };

/**
 * API scaling: /trends/grid returns Sen's slope per year, the same unit as the demo
 * profile (e.g. °C / year), so the height shares domain and both scenarios read identically.
 */
export const HEX_API_PRESENTATION: Record<ClimateVariable, { heightDomain: number; resolutionDegrees: number }> = {
  Gistemp: { heightDomain: HEX_VARIABLE_PROFILES.Gistemp.heightDomain, resolutionDegrees: 2 },
  ModisNdvi: { heightDomain: HEX_VARIABLE_PROFILES.ModisNdvi.heightDomain, resolutionDegrees: 2.2 },
  GraceMass: { heightDomain: HEX_VARIABLE_PROFILES.GraceMass.heightDomain, resolutionDegrees: 2.2 },
  Oco2: { heightDomain: HEX_VARIABLE_PROFILES.Oco2.heightDomain, resolutionDegrees: 2.2 },
};

function abortError() {
  return new DOMException('Hex query aborted', 'AbortError');
}

/** Cancels delivery even if the underlying HTTP service does not yet accept AbortSignal. */
function withAbort<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return request;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const cancel = () => reject(abortError());
    signal.addEventListener('abort', cancel, { once: true });
    request.then(
      (value) => {
        signal.removeEventListener('abort', cancel);
        if (signal.aborted) reject(abortError());
        else resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', cancel);
        reject(error);
      },
    );
  });
}

function finiteNumber(value: unknown, name: string, index: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Trends API: invalid ${name} at cell ${index + 1}.`);
  }
  return value;
}

function assertMatchingContext(row: Record<string, unknown>, filter: TrendFilterParams) {
  if (row.variable !== undefined && row.variable !== filter.variable && row.variable !== API_VARIABLE_IDS[filter.variable]) {
    throw new Error('Trends response does not match variable.');
  }
  for (const field of ['startYear', 'endYear'] as const) {
    if (row[field] !== undefined && row[field] !== filter[field]) {
      throw new Error(`Trends response does not match ${field}.`);
    }
  }
}

function readUnit(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > 80) {
    throw new Error('API returned an invalid trend unit.');
  }
  return value.trim();
}

function readResolution(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const resolution = finiteNumber(value, 'resolutionDegrees', 0);
  if (resolution <= 0 || resolution > 10) throw new Error('Cell resolution must be between 0 and 10 degrees.');
  return resolution;
}

/** Accepts current DTO without requiring confidenceInterval95; rejects corrupt data or mismatched filter data. */
export function adaptApiHexDataset(payload: unknown, filter: TrendFilterParams): HexDataset {
  const metadata: Record<string, unknown> = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown> : {};
  const rows: unknown = Array.isArray(payload) ? payload : metadata.cells;
  if (!Array.isArray(rows)) throw new Error('Trends API must return a list of cells or an object with cells.');
  assertMatchingContext(metadata, filter);
  const seen = new Set<string>();
  const envelopeUnit = readUnit(metadata.unit);
  const envelopeResolution = readResolution(metadata.resolutionDegrees);
  let unit = envelopeUnit;
  let resolution = envelopeResolution;
  let unitCount = 0;
  let resolutionCount = 0;
  const cells: HexCell[] = rows.map((entry: unknown, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`Invalid cell ${index + 1} in API.`);
    const row = entry as Record<string, unknown>;
    const latitude = finiteNumber(row.latitude, 'latitude', index);
    const longitude = finiteNumber(row.longitude, 'longitude', index);
    const slope = finiteNumber(row.sensSlope, 'sensSlope', index);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`Coordinates out of range at cell ${index + 1}.`);
    }
    assertMatchingContext(row, filter);
    const nextUnit = readUnit(row.unit);
    if (nextUnit !== undefined) {
      unitCount += 1;
      if (unit !== undefined && unit !== nextUnit) throw new Error('API mixes trend units.');
      unit = nextUnit;
    }
    const nextResolution = readResolution(row.resolutionDegrees);
    if (nextResolution !== undefined) {
      resolutionCount += 1;
      if (resolution !== undefined && resolution !== nextResolution) throw new Error('API mixes cell resolutions.');
      resolution = nextResolution;
    }
    const normalizedLng = longitude === 180 ? -180 : longitude;
    const id = `api:${latitude.toFixed(7)}:${normalizedLng.toFixed(7)}`;
    if (seen.has(id)) throw new Error('API returned duplicate trends for the same location.');
    seen.add(id);
    return { id, latitude, longitude: normalizedLng, slope };
  });
  if (envelopeUnit === undefined && unitCount > 0 && unitCount !== cells.length) {
    throw new Error('API must declare unit for all cells or on the containing envelope object.');
  }
  if (envelopeResolution === undefined && resolutionCount > 0 && resolutionCount !== cells.length) {
    throw new Error('API must declare resolution for all cells or on the containing envelope object.');
  }
  const heightDomain = metadata.heightDomain === undefined
    ? HEX_API_PRESENTATION[filter.variable].heightDomain : finiteNumber(metadata.heightDomain, 'heightDomain', 0);
  if (heightDomain <= 0) throw new Error('Height domain must be greater than zero.');
  return {
    cells,
    variable: filter.variable,
    startYear: filter.startYear,
    endYear: filter.endYear,
    source: 'api',
    // The current API does not declare the time base for sensSlope: do not infer a scientific unit.
    unit: unit ?? 'slope · undeclared unit',
    heightDomain,
    resolutionDegrees: resolution ?? HEX_API_PRESENTATION[filter.variable].resolutionDegrees,
  };
}

export async function getHexDataset(filter: TrendFilterParams, signal?: AbortSignal): Promise<HexDataset> {
  if (signal?.aborted) throw abortError();
  if (!Number.isInteger(filter.startYear) || !Number.isInteger(filter.endYear)
    || filter.startYear < 1 || filter.endYear > 9999 || filter.startYear > filter.endYear
    || !Object.hasOwn(HEX_VARIABLE_PROFILES, filter.variable)) {
    throw new Error('The observation period or variable is invalid.');
  }
  const mode = readDataSourceMode(import.meta.env.VITE_HEX_DATA_SOURCE, 'VITE_HEX_DATA_SOURCE');
  const resolved = await withAbort(resolveVariableSource(mode, filter.variable), signal);
  if (resolved.source === 'demo') {
    const profile: unknown = import.meta.env.VITE_HEX_DEMO_PROFILE ?? 'global';
    if (profile !== 'global' && profile !== 'regional' && profile !== 'stress') throw new Error('VITE_HEX_DEMO_PROFILE must be global, regional, or stress.');
    return withAbort(Promise.resolve().then(() => createDemoHexDataset(filter, profile)), signal);
  }
  const payload: unknown = await trendService.getGridTrends(filter, signal);
  if (signal?.aborted) throw abortError();
  return adaptApiHexDataset(payload, filter);
}
