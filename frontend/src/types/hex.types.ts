import type { ClimateVariable } from './climate.types';

/** A column represents a trend at a location, never terrain elevation. */
export interface HexCell {
  id: string;
  latitude: number;
  longitude: number;
  slope: number;
}

/** Boundary between data source and scene. Contains no Three.js objects. */
export interface HexDataset {
  cells: HexCell[];
  variable: ClimateVariable;
  startYear: number;
  endYear: number;
  unit: string;
  source: 'demo' | 'api';
  /** Magnitude that fills the vertical scale; remains fixed when dates change. */
  heightDomain: number;
  /** Nominal center spacing; visual footprint does not imply NASA coverage. */
  resolutionDegrees: number;
}
