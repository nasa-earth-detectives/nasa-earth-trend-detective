import type { ClimateObservation, ClimateVariable } from '../types/climate.types';
import type { DatasetProvenance, DataSource } from '../types/dataset.types';
import { createDemoObservations } from './demo/observationDemoData';
import { readDataSourceMode, resolveVariableSource } from './datasetCatalog';
import { trendService } from './trendService';

export type ObservationSource = DataSource;
export interface ObservationDataset {
  observations: ClimateObservation[];
  source: ObservationSource;
  provenance: DatasetProvenance | null;
}
const API_VARIABLE_IDS: Record<ClimateVariable, number> = { Gistemp: 1, ModisNdvi: 2, GraceMass: 3, Oco2: 4 };
const unitPatterns: Record<ClimateVariable, RegExp> = {
  Gistemp: /^(°c|celsius)( ?anomaly)?$/,
  ModisNdvi: /^(ndvi|1|adimensional)$/,
  GraceMass: /^(cm|cm ewh|cm h2o eq\.?|cm water equivalent)$/,
  Oco2: /^ppm$/,
};

function finite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`API returned invalid ${field}.`);
  return value;
}

/** Boundary of DTO: does not convert slopes or infer missing units or anomalies. */
export function adaptApiObservations(payload: unknown, variable: ClimateVariable, year: number): ClimateObservation[] {
  if (!Array.isArray(payload)) throw new Error('Observations API must return a list.');
  const ids = new Set<string>();
  return payload.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new Error('API returned an invalid observation.');
    const row = entry as Record<string, unknown>;
    if (row.variable !== variable && row.variable !== API_VARIABLE_IDS[variable]) {
      throw new Error('Response variable does not match query.');
    }
    const latitude = finite(row.latitude, 'latitude');
    const longitude = finite(row.longitude, 'longitude');
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('API coordinates are out of range.');
    const value = finite(row.value, 'value');
    const anomaly = row.anomaly == null ? undefined : finite(row.anomaly, 'anomaly');
    const unit = typeof row.unit === 'string' ? row.unit.trim() : '';
    if (!unitPatterns[variable].test(unit.toLowerCase().replaceAll('₂', '2').replace(/\s+/g, ' '))) {
      throw new Error(`API returned an incompatible unit for ${variable}: ${unit || 'no unit'}.`);
    }
    if (variable === 'Gistemp' && anomaly === undefined && !/anomaly/i.test(unit)) {
      throw new Error('API must declare the temperature anomaly; a value in °C alone does not identify an anomaly.');
    }
    if (typeof row.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.timestamp)
      || !Number.isFinite(Date.parse(row.timestamp)) || Number(row.timestamp.slice(0, 4)) !== year) {
      throw new Error('Observation year does not match query.');
    }
    if (typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id)) {
      throw new Error('API returned empty or duplicate observation IDs.');
    }
    ids.add(row.id);
    return { id: row.id, variable, latitude, longitude, value, unit, timestamp: row.timestamp,
      ...(anomaly === undefined ? {} : { anomaly }) };
  });
}

function cancelled() { return new DOMException('Observation query aborted.', 'AbortError'); }

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
    throw new Error('Observation variable or year is invalid.');
  }
  const mode = readDataSourceMode(import.meta.env.VITE_OBSERVATION_DATA_SOURCE, 'VITE_OBSERVATION_DATA_SOURCE');
  const resolved = await withAbort(resolveVariableSource(mode, variable), signal);
  const demo = async (): Promise<ObservationDataset> => ({ observations: await withAbort(
    Promise.resolve().then(() => createDemoObservations(variable, year)), signal), source: 'demo', provenance: null });
  if (resolved.source === 'demo') return demo();
  try {
    const payload: unknown = await trendService.getObservations(variable, year, signal);
    return { observations: adaptApiObservations(payload, variable, year), source: 'api', provenance: resolved.provenance };
  } catch (error) {
    // In auto mode, a temporary API outage falls back to demo, labeled as such; in api mode the error is thrown.
    if (mode !== 'auto' || (error instanceof DOMException && error.name === 'AbortError')) throw error;
    console.warn(`Observations for ${variable} ${year} not available from API; falling back to demo.`, error);
    return demo();
  }
}
