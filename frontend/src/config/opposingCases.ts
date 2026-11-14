/**
 * Challenge case studies: two regions where the same variables move in opposite directions.
 *
 * Only locations and variables live here. Numbers are NOT hardcoded: they are computed from
 * each cell's real time series whenever the panel opens (replacing hand-typed tenths of a
 * degree and gigatonnes alongside variables that had no data).
 *
 * Chosen on 2026-11-14 by scanning the 1981-2025 MERRA-2 grid: among land cells with the
 * largest Mann-Kendall |Z| in precipitation (> 6), air temperature and soil moisture also
 * move in opposite directions between the two regions.
 */
import type { ClimateVariable } from '../types/climate.types';

export interface CaseRegion {
  id: string;
  name: string;
  /** Center of a 2° grid cell so the query returns that exact cell. */
  lat: number;
  lng: number;
}

export const CASE_REGIONS: readonly [CaseRegion, CaseRegion] = [
  { id: 'brazil-centre-west', name: 'Center-West Brazil', lat: -19, lng: -53 },
  { id: 'bangladesh', name: 'Bangladesh', lat: 23, lng: 91 },
];

export const CASE_VARIABLES: readonly ClimateVariable[] =
  ['Merra2Temperature', 'Merra2Precipitation', 'Merra2SoilMoisture', 'Merra2Evaporation'];

export const caseKey = (variable: ClimateVariable, regionId: string) => `${variable}:${regionId}`;
