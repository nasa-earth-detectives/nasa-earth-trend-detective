import type { ClimateObservation, ClimateVariable } from '../types/climate.types';
import { createDemoObservations } from './demo/observationDemoData';
import { trendService } from './trendService';

export type ObservationSource = 'demo' | 'api';
export interface ObservationDataset { observations: ClimateObservation[]; source: ObservationSource }
const configuredSource: unknown = import.meta.env.VITE_OBSERVATION_DATA_SOURCE ?? 'demo';
export const OBSERVATION_DATA_SOURCE: ObservationSource = configuredSource === 'api' ? 'api' : 'demo';
const API_VARIABLE_IDS: Record<ClimateVariable, number> = { Gistemp: 1, ModisNdvi: 2, GraceMass: 3, Oco2: 4 };
const unitPatterns: Record<ClimateVariable, RegExp> = {
  Gistemp: /^(°c|celsius)( ?anomaly)?$/,
  ModisNdvi: /^(ndvi|1|adimensional)$/,
  GraceMass: /^(cm|cm h2o eq\.?|cm water equivalent)$/,
  Oco2: /^ppm$/,
};

function finite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`La API devolvió ${field} no válido.`);
  return value;
}

/** Frontera del DTO: no convierte pendientes ni infiere unidades o anomalías ausentes. */
export function adaptApiObservations(payload: unknown, variable: ClimateVariable, year: number): ClimateObservation[] {
  if (!Array.isArray(payload)) throw new Error('La API de observaciones debe devolver una lista.');
  const ids = new Set<string>();
  return payload.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new Error('La API devolvió una observación no válida.');
    const row = entry as Record<string, unknown>;
    if (row.variable !== variable && row.variable !== API_VARIABLE_IDS[variable]) {
      throw new Error('La variable de la respuesta no coincide con la consulta.');
    }
    const latitude = finite(row.latitude, 'latitude');
    const longitude = finite(row.longitude, 'longitude');
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Las coordenadas de la API están fuera de rango.');
    const value = finite(row.value, 'value');
    const anomaly = row.anomaly == null ? undefined : finite(row.anomaly, 'anomaly');
    const unit = typeof row.unit === 'string' ? row.unit.trim() : '';
    if (!unitPatterns[variable].test(unit.toLowerCase().replaceAll('₂', '2').replace(/\s+/g, ' '))) {
      throw new Error(`La API devolvió una unidad incompatible con ${variable}: ${unit || 'sin unidad'}.`);
    }
    if (variable === 'Gistemp' && anomaly === undefined && !/anomaly/i.test(unit)) {
      throw new Error('La API debe declarar la anomalía de temperatura; un valor en °C no identifica por sí solo una anomalía.');
    }
    if (typeof row.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.timestamp)
      || !Number.isFinite(Date.parse(row.timestamp)) || Number(row.timestamp.slice(0, 4)) !== year) {
      throw new Error('El año de la observación no coincide con la consulta.');
    }
    if (typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id)) {
      throw new Error('La API devolvió identificadores de observación vacíos o repetidos.');
    }
    ids.add(row.id);
    return { id: row.id, variable, latitude, longitude, value, unit, timestamp: row.timestamp,
      ...(anomaly === undefined ? {} : { anomaly }) };
  });
}

function cancelled() { return new DOMException('Consulta de observaciones cancelada.', 'AbortError'); }

function withAbort<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return request;
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise<T>((resolve, reject) => {
    const cancel = () => reject(cancelled());
    signal.addEventListener('abort', cancel, { once: true });
    request.then(value => {
      signal.removeEventListener('abort', cancel);
      if (signal.aborted) reject(cancelled());
      else resolve(value);
    }, error => {
      signal.removeEventListener('abort', cancel);
      reject(error);
    });
  });
}

export async function getObservationDataset(variable: ClimateVariable, year: number, signal?: AbortSignal): Promise<ObservationDataset> {
  if (signal?.aborted) throw cancelled();
  if (!Object.hasOwn(API_VARIABLE_IDS, variable) || !Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error('La variable o el año de observación no son válidos.');
  }
  if (configuredSource !== 'demo' && configuredSource !== 'api') {
    throw new Error('VITE_OBSERVATION_DATA_SOURCE debe ser demo o api.');
  }
  if (configuredSource === 'demo') return { observations: await withAbort(
    Promise.resolve().then(() => createDemoObservations(variable, year)), signal), source: 'demo' };
  const payload: unknown = await withAbort(trendService.getObservations(variable, year), signal);
  return { observations: adaptApiObservations(payload, variable, year), source: 'api' };
}
