import type { ClimateObservation } from '../types/climate.types';

const RADIANS = Math.PI / 180;

/**
 * Thins a regular lat/lon grid for rendering with approximately uniform area. In a 2° grid,
 * the 180 centers of a polar row fit in a tiny circle and columns pile on top of each other.
 * Along each row, one in every round(1/cos φ) cells is preserved. Does not interpolate or
 * move anything: every retained cell is an actual observation, with its exact value.
 */
export function thinRegularGrid(observations: ClimateObservation[]): ClimateObservation[] {
  const rows = new Map<number, ClimateObservation[]>();
  for (const observation of observations) {
    const row = rows.get(observation.latitude);
    if (row) row.push(observation);
    else rows.set(observation.latitude, [observation]);
  }
  const kept: ClimateObservation[] = [];
  for (const [latitude, row] of rows) {
    const step = Math.max(1, Math.round(1 / Math.max(Math.cos(latitude * RADIANS), 1e-6)));
    row.sort((a, b) => a.longitude - b.longitude);
    for (let index = 0; index < row.length; index += step) kept.push(row[index]);
  }
  return kept;
}
