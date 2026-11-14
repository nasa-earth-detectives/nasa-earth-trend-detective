import type { CaseVerdict } from '../hooks/useOpposingCases';

export type VerdictTone = 'up' | 'down' | 'flat' | 'none';

/**
 * Tono del veredicto: sin significancia no se afirma ni subida ni bajada, sea cual sea el signo. Si la
 * API envía el test con preblanqueo, la tendencia tiene que superarlo también: una que sólo pasa el
 * test clásico puede ser una racha larga y no se presenta como "sube" o "baja".
 */
export function verdictTone(verdict: CaseVerdict | undefined): VerdictTone {
  if (verdict?.status !== 'ready') return 'none';
  const { trend } = verdict;
  const holds = trend.isSignificant && (trend.prewhitened?.isSignificant ?? true);
  if (!holds || trend.sensSlope === 0) return 'flat';
  return trend.sensSlope > 0 ? 'up' : 'down';
}
