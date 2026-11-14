import type { HexCell, HexSignificance } from '../types/hex.types';

const probability = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : undefined;
const count = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;

/**
 * Significancia de una celda de /trends/grid. Son campos añadidos al DTO: si la API es anterior y no
 * los envía, la celda queda sin ellos y la interfaz sencillamente no los muestra.
 */
export function readCellSignificance(row: Record<string, unknown>): Pick<HexCell, 'pValue' | 'adjustedPValue' | 'robust'> {
  const pValue = probability(row.pValue);
  const adjustedPValue = probability(row.adjustedPValue);
  if (pValue === undefined || adjustedPValue === undefined || typeof row.isSignificantCorrected !== 'boolean') return {};
  return { pValue, adjustedPValue, robust: row.isSignificantCorrected };
}

/** Resumen del mapa: cuántas celdas superan cada filtro. Undefined si la API no lo declara completo. */
export function readGridSignificance(metadata: Record<string, unknown>, analyzed: number): HexSignificance | undefined {
  const uncorrected = count(metadata.significantCells);
  const persistent = count(metadata.prewhitenedSignificantCells);
  const corrected = count(metadata.correctedSignificantCells);
  const falseDiscoveryRate = probability(metadata.falseDiscoveryRate);
  if (uncorrected === undefined || persistent === undefined || corrected === undefined || !falseDiscoveryRate) return undefined;
  return { analyzed, uncorrected, persistent, corrected, falseDiscoveryRate };
}
