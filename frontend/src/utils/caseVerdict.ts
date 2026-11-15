import type { CaseVerdict } from '../hooks/useOpposingCases';

export type VerdictTone = 'up' | 'down' | 'flat' | 'none';

/**
 * Verdict tone: without significance neither rising nor falling is claimed, regardless of sign.
 * If the API provides the prewhitened test, the trend must pass it as well: one that only passes
 * the classic test may be a long streak and is not presented as "Rising" or "Falling".
 */
export function verdictTone(verdict: CaseVerdict | undefined): VerdictTone {
  if (verdict?.status !== 'ready') return 'none';
  const { trend } = verdict;
  const holds = trend.isSignificant && (trend.prewhitened?.isSignificant ?? true);
  if (!holds || trend.sensSlope === 0) return 'flat';
  return trend.sensSlope > 0 ? 'up' : 'down';
}
