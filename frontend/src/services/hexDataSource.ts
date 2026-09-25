import type { HexCell, HexDataset } from '../types/hex.types';
import type { ClimateVariable } from '../types/climate.types';
import type { TrendFilterParams } from '../types/trend.types';
import { createDemoHexDataset, HEX_VARIABLE_PROFILES } from './demo/hexDemoData';
import { trendService } from './trendService';

/** Correspondencia explícita con backend/.../Enums/ClimateVariable.cs, sin suponer strings JSON. */
const API_VARIABLE_IDS: Record<ClimateVariable, number> = { Gistemp: 1, ModisNdvi: 2, GraceMass: 3, Oco2: 4 };

/** Escala API provisional, independiente del escenario demo y de su unidad anual. */
export const HEX_API_PRESENTATION: Record<ClimateVariable, { heightDomain: number; resolutionDegrees: number }> = {
  Gistemp: { heightDomain: 1, resolutionDegrees: 2.2 },
  ModisNdvi: { heightDomain: 1, resolutionDegrees: 2.2 },
  GraceMass: { heightDomain: 1, resolutionDegrees: 2.2 },
  Oco2: { heightDomain: 1, resolutionDegrees: 2.2 },
};

function abortError() {
  return new DOMException('Consulta de hexágonos cancelada', 'AbortError');
}

/** Cancela la entrega aunque el servicio HTTP existente todavía no reciba AbortSignal. */
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
    throw new Error(`API de tendencias: ${name} inválido en la celda ${index + 1}.`);
  }
  return value;
}

function assertMatchingContext(row: Record<string, unknown>, filter: TrendFilterParams) {
  if (row.variable !== undefined && row.variable !== filter.variable && row.variable !== API_VARIABLE_IDS[filter.variable]) {
    throw new Error('La respuesta de tendencias no coincide con variable.');
  }
  for (const field of ['startYear', 'endYear'] as const) {
    if (row[field] !== undefined && row[field] !== filter[field]) {
      throw new Error(`La respuesta de tendencias no coincide con ${field}.`);
    }
  }
}

function readUnit(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > 80) {
    throw new Error('La API devolvió una unidad de tendencia inválida.');
  }
  return value.trim();
}

function readResolution(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const resolution = finiteNumber(value, 'resolutionDegrees', 0);
  if (resolution <= 0 || resolution > 10) throw new Error('La resolución de celdas debe estar entre 0 y 10 grados.');
  return resolution;
}

/** Acepta el DTO actual sin exigir confidenceInterval95; rechaza datos corruptos o de otro filtro. */
export function adaptApiHexDataset(payload: unknown, filter: TrendFilterParams): HexDataset {
  const metadata: Record<string, unknown> = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown> : {};
  const rows: unknown = Array.isArray(payload) ? payload : metadata.cells;
  if (!Array.isArray(rows)) throw new Error('La API de tendencias debe devolver una lista de celdas o un objeto con cells.');
  assertMatchingContext(metadata, filter);
  const seen = new Set<string>();
  const envelopeUnit = readUnit(metadata.unit);
  const envelopeResolution = readResolution(metadata.resolutionDegrees);
  let unit = envelopeUnit;
  let resolution = envelopeResolution;
  let unitCount = 0;
  let resolutionCount = 0;
  const cells: HexCell[] = rows.map((entry: unknown, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`Celda ${index + 1} inválida en la API.`);
    const row = entry as Record<string, unknown>;
    const latitude = finiteNumber(row.latitude, 'latitude', index);
    const longitude = finiteNumber(row.longitude, 'longitude', index);
    const slope = finiteNumber(row.sensSlope, 'sensSlope', index);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`Coordenadas fuera de rango en la celda ${index + 1}.`);
    }
    assertMatchingContext(row, filter);
    const nextUnit = readUnit(row.unit);
    if (nextUnit !== undefined) {
      unitCount += 1;
      if (unit !== undefined && unit !== nextUnit) throw new Error('La API mezcla unidades de tendencia.');
      unit = nextUnit;
    }
    const nextResolution = readResolution(row.resolutionDegrees);
    if (nextResolution !== undefined) {
      resolutionCount += 1;
      if (resolution !== undefined && resolution !== nextResolution) throw new Error('La API mezcla resoluciones de celdas.');
      resolution = nextResolution;
    }
    const normalizedLng = longitude === 180 ? -180 : longitude;
    const id = `api:${latitude.toFixed(7)}:${normalizedLng.toFixed(7)}`;
    if (seen.has(id)) throw new Error('La API devolvió dos tendencias para la misma ubicación.');
    seen.add(id);
    return { id, latitude, longitude: normalizedLng, slope };
  });
  if (envelopeUnit === undefined && unitCount > 0 && unitCount !== cells.length) {
    throw new Error('La API debe declarar la unidad para todas las celdas o en el objeto que las contiene.');
  }
  if (envelopeResolution === undefined && resolutionCount > 0 && resolutionCount !== cells.length) {
    throw new Error('La API debe declarar la resolución para todas las celdas o en el objeto que las contiene.');
  }
  const heightDomain = metadata.heightDomain === undefined
    ? HEX_API_PRESENTATION[filter.variable].heightDomain : finiteNumber(metadata.heightDomain, 'heightDomain', 0);
  if (heightDomain <= 0) throw new Error('El dominio vertical debe ser mayor que cero.');
  return {
    cells,
    variable: filter.variable,
    startYear: filter.startYear,
    endYear: filter.endYear,
    source: 'api',
    // La API actual no declara la base temporal de sensSlope: no inferir una unidad científica.
    unit: unit ?? 'pendiente · unidad no declarada',
    heightDomain,
    resolutionDegrees: resolution ?? HEX_API_PRESENTATION[filter.variable].resolutionDegrees,
  };
}

export async function getHexDataset(filter: TrendFilterParams, signal?: AbortSignal): Promise<HexDataset> {
  if (signal?.aborted) throw abortError();
  if (!Number.isInteger(filter.startYear) || !Number.isInteger(filter.endYear)
    || filter.startYear < 1 || filter.endYear > 9999 || filter.startYear > filter.endYear
    || !Object.hasOwn(HEX_VARIABLE_PROFILES, filter.variable)) {
    throw new Error('El periodo o la variable de observación no son válidos.');
  }
  const source: unknown = import.meta.env.VITE_HEX_DATA_SOURCE ?? 'demo';
  if (source === 'demo') {
    const profile: unknown = import.meta.env.VITE_HEX_DEMO_PROFILE ?? 'global';
    if (profile !== 'global' && profile !== 'regional' && profile !== 'stress') throw new Error('VITE_HEX_DEMO_PROFILE debe ser global, regional o stress.');
    return withAbort(Promise.resolve().then(() => createDemoHexDataset(filter, profile)), signal);
  }
  if (source === 'api') {
    const payload: unknown = await withAbort(trendService.getTrends(filter), signal);
    if (signal?.aborted) throw abortError();
    return adaptApiHexDataset(payload, filter);
  }
  throw new Error('VITE_HEX_DATA_SOURCE debe ser demo o api.');
}
