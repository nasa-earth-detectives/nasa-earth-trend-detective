import type { ClimateVariable } from './climate.types';

/** Una columna representa una tendencia en una ubicación, nunca elevación del terreno. */
export interface HexCell {
  id: string;
  latitude: number;
  longitude: number;
  slope: number;
}

/** Frontera entre la fuente de datos y la escena. No contiene objetos de Three.js. */
export interface HexDataset {
  cells: HexCell[];
  variable: ClimateVariable;
  startYear: number;
  endYear: number;
  unit: string;
  source: 'demo' | 'api';
  /** Magnitud que llena la escala vertical; permanece fija al cambiar las fechas. */
  heightDomain: number;
  /** Separación nominal de centros; la huella visual no implica una cobertura NASA. */
  resolutionDegrees: number;
}
