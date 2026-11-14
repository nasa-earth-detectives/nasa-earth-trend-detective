/**
 * Casos de estudio del reto: dos regiones donde las mismas variables van en sentidos opuestos.
 *
 * Aquí sólo viven los lugares y las variables. Las cifras NO se escriben: se calculan con la serie
 * real de cada celda cada vez que se abre el panel (antes había décimas de grado y gigatoneladas
 * tecleadas a mano junto a variables que ni siquiera tenían datos).
 *
 * Elegidas el 2026-11-14 recorriendo la grilla MERRA-2 de 1981-2025: están entre las celdas de tierra
 * con mayor |Z| de Mann-Kendall en precipitación (más de 6) y, además, la temperatura del aire y la
 * humedad del suelo también van en sentidos contrarios entre una y otra.
 */
import type { ClimateVariable } from '../types/climate.types';

export interface CaseRegion {
  id: string;
  name: string;
  /** Centro de una celda de la grilla de 2°, para que la consulta devuelva exactamente esa celda. */
  lat: number;
  lng: number;
}

export const CASE_REGIONS: readonly [CaseRegion, CaseRegion] = [
  { id: 'brazil-centre-west', name: 'Centro-oeste de Brasil', lat: -19, lng: -53 },
  { id: 'bangladesh', name: 'Bangladés', lat: 23, lng: 91 },
];

export const CASE_VARIABLES: readonly ClimateVariable[] =
  ['Merra2Temperature', 'Merra2Precipitation', 'Merra2SoilMoisture', 'Merra2Evaporation'];

export const caseKey = (variable: ClimateVariable, regionId: string) => `${variable}:${regionId}`;
