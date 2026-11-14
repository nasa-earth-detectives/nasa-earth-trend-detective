import type { CaseVerdict } from '../hooks/useOpposingCases';

export type VerdictTone = 'up' | 'down' | 'flat' | 'none';

/** Verdict tone: without significance, neither an increase nor a decrease is claimed, regardless of sign. */
export function verdictTone(verdict: CaseVerdict | undefined): VerdictTone {
  if (verdict?.status !== 'ready') return 'none';
  if (!verdict.trend.isSignificant || verdict.trend.sensSlope === 0) return 'flat';
  return verdict.trend.sensSlope > 0 ? 'up' : 'down';
}
