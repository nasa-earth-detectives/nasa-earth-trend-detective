import type { HexCell, HexSignificance } from '../types/hex.types';

const probability = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : undefined;
const count = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;

/**
 * Significance of a cell from /trends/grid. These fields were added to the DTO: if an older API
 * does not send them, the cell omits them and the UI simply does not display them.
 */
export function readCellSignificance(row: Record<string, unknown>): Pick<HexCell, 'pValue' | 'adjustedPValue' | 'robust'> {
  const pValue = probability(row.pValue);
  const adjustedPValue = probability(row.adjustedPValue);
  if (pValue === undefined || adjustedPValue === undefined || typeof row.isSignificantCorrected !== 'boolean') return {};
  return { pValue, adjustedPValue, robust: row.isSignificantCorrected };
}

/** Map summary: how many cells pass each filter. Undefined if the API does not declare it in full. */
export function readGridSignificance(metadata: Record<string, unknown>, analyzed: number): HexSignificance | undefined {
  const uncorrected = count(metadata.significantCells);
  const persistent = count(metadata.prewhitenedSignificantCells);
  const corrected = count(metadata.correctedSignificantCells);
  const falseDiscoveryRate = probability(metadata.falseDiscoveryRate);
  if (uncorrected === undefined || persistent === undefined || corrected === undefined || !falseDiscoveryRate) return undefined;
  return { analyzed, uncorrected, persistent, corrected, falseDiscoveryRate };
}
