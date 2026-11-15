import type { ClimateVariable } from './climate.types';

/** Provenance declared by the API (dataset_provenance table); displayed as-is by the UI. */
export interface DatasetProvenance {
  provider: string;
  product: string;
  unit: string;
  /** Sen's slope unit per year, e.g. "°C / year". */
  trendUnit: string;
  baseline: string | null;
  resolutionDegrees: number;
  sourceUrl: string;
  coverageStart: number;
  coverageEnd: number;
  lastMonth: string;
  /** Interim source pending official challenge data. */
  interim: boolean;
  citation: string;
}

export type DataSource = 'demo' | 'api';

/** Which source serves a variable and, if the API, with what provenance. */
export interface ResolvedSource {
  source: DataSource;
  provenance: DatasetProvenance | null;
}

export type DatasetCatalog = ReadonlyMap<ClimateVariable, DatasetProvenance>;
