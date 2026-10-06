import type { ClimateObservation } from '../types/climate.types';

const RADIANS = Math.PI / 180;

/**
 * Aclara una grilla regular lat/lon para dibujarla con área aproximadamente uniforme. En una grilla
 * de 2° los 180 centros de una fila polar caben en una circunferencia diminuta y las columnas se
 * apilan unas sobre otras. Por fila se conserva una de cada round(1/cos φ) celdas. No interpola ni
 * mueve nada: cada celda que queda es una observación recibida, con su valor exacto.
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
