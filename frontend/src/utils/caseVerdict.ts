import type { CaseVerdict } from '../hooks/useOpposingCases';

export type VerdictTone = 'up' | 'down' | 'flat' | 'none';

/** Tono del veredicto: sin significancia no se afirma ni subida ni bajada, sea cual sea el signo. */
export function verdictTone(verdict: CaseVerdict | undefined): VerdictTone {
  if (verdict?.status !== 'ready') return 'none';
  if (!verdict.trend.isSignificant || verdict.trend.sensSlope === 0) return 'flat';
  return verdict.trend.sensSlope > 0 ? 'up' : 'down';
}
