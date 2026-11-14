import type { ClimateVariable } from './climate.types';

/** Una columna representa una tendencia en una ubicación, nunca elevación del terreno. */
export interface HexCell {
  id: string;
  latitude: number;
  longitude: number;
  slope: number;
  /** Valor p de Mann-Kendall sin corregir. Sólo con datos de la API. */
  pValue?: number;
  /** Valor q: el p con preblanqueo, ajustado por Benjamini-Hochberg entre todas las celdas del mapa. */
  adjustedPValue?: number;
  /** La tendencia supera la corrección por persistencia y el control de falsos hallazgos. */
  robust?: boolean;
}

/** Celdas del mapa que superan cada filtro de significancia, del más permisivo al más exigente. */
export interface HexSignificance {
  analyzed: number;
  uncorrected: number;
  persistent: number;
  corrected: number;
  falseDiscoveryRate: number;
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
  /** Recuento de celdas significativas; ausente con datos de muestra o una API que no lo declare. */
  significance?: HexSignificance;
}
