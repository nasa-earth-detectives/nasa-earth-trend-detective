import type { ClimateVariable } from './climate.types';

/** Procedencia declarada por la API (tabla dataset_provenance); la interfaz la muestra tal cual. */
export interface DatasetProvenance {
  provider: string;
  product: string;
  unit: string;
  /** Unidad de la pendiente de Sen por año, p. ej. "°C / año". */
  trendUnit: string;
  baseline: string | null;
  resolutionDegrees: number;
  sourceUrl: string;
  coverageStart: number;
  coverageEnd: number;
  lastMonth: string;
  /** Fuente provisional hasta recibir la oficial del reto. */
  interim: boolean;
  citation: string;
}

export type DataSource = 'demo' | 'api';

/** Qué fuente atiende una variable y, si es la API, con qué procedencia. */
export interface ResolvedSource {
  source: DataSource;
  provenance: DatasetProvenance | null;
}

export type DatasetCatalog = ReadonlyMap<ClimateVariable, DatasetProvenance>;
