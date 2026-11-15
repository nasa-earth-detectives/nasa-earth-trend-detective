import type { ClimateVariable } from './climate.types';

/** A column represents a trend at a location, never terrain elevation. */
export interface HexCell {
  id: string;
  latitude: number;
  longitude: number;
  slope: number;
  /** Uncorrected Mann-Kendall p-value. Only present with API data. */
  pValue?: number;
  /** q-value: prewhitened p-value, Benjamini-Hochberg adjusted across all cells in the map. */
  adjustedPValue?: number;
  /** The trend passes persistence correction and false discovery rate control. */
  robust?: boolean;
}

/** Map cells passing each significance filter, from most permissive to strictest. */
export interface HexSignificance {
  analyzed: number;
  uncorrected: number;
  persistent: number;
  corrected: number;
  falseDiscoveryRate: number;
}

/** Boundary between data source and scene. Contains no Three.js objects. */
export interface HexDataset {
  cells: HexCell[];
  variable: ClimateVariable;
  startYear: number;
  endYear: number;
  unit: string;
  source: 'api';
  /** Magnitude that fills the vertical scale; remains fixed when dates change. */
  heightDomain: number;
  /** Nominal center spacing; visual footprint does not imply NASA coverage. */
  resolutionDegrees: number;
  /** Count of significant cells; absent with sample data or an API that does not declare it. */
  significance?: HexSignificance;
}
