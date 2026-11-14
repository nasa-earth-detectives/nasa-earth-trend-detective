/**
 * detectiveAnalysis.ts
 * Scientific utilities for coordinate formatting and plain-language interpretation of
 * the Mann-Kendall / Sen verdict, without overpromising beyond what the test proves.
 */

import type { ClimateVariable } from '../types/climate.types';
import { HEX_PRESENTATION } from '../config/hexPresentation';

export function formatCoordinate(val: number, posChar: string, negChar: string): string {
  const dir = val >= 0 ? posChar : negChar;
  return `${Math.abs(val).toFixed(2)}° ${dir}`;
}

/** Three possible states. "No conclusive change" does not mean "no change". */
export type SignificanceTone = 'increase' | 'decrease' | 'inconclusive';

export interface SignificancePresentation {
  tone: SignificanceTone;
  label: string;
  /** What can be stated from these data. */
  claim: string;
  /** What cannot be stated and why. */
  caveat: string;
}

/** Minimum fields required for reading: works for the card and for a grid cell. */
export interface SignificanceInput {
  isSignificant: boolean;
  pValue: number;
  sensSlope: number;
  /** Mann-Kendall Z-score; shown if provided by the source. */
  zScore?: number;
}

const frequency = new Intl.NumberFormat('en', { maximumSignificantDigits: 2 });

export function describeSignificance(variable: ClimateVariable, mk: SignificanceInput): SignificancePresentation {
  const subject = HEX_PRESENTATION[variable];
  const p = mk.pValue < 0.001 ? '< 0.001' : `= ${frequency.format(mk.pValue)}`;

  if (!mk.isSignificant) {
    return {
      tone: 'inconclusive',
      label: 'No conclusive change',
      claim: `The slope sign is ${mk.sensSlope > 0 ? 'positive' : mk.sensSlope < 0 ? 'negative' : 'zero'}, `
        + 'but the test cannot distinguish it from chance at 95% confidence.',
      caveat: `A p-value ${p} greater than 0.05 does not prove there is no change: it proves this series is not enough to confirm it. `
        + 'With more years or less noise, the verdict could change.',
    };
  }

  const increase = mk.sensSlope > 0;
  return {
    tone: increase ? 'increase' : 'decrease',
    label: increase ? 'Sustained increase' : 'Sustained decrease',
    claim: `${increase ? subject.increase : subject.decrease} over the period (p ${p}).`,
    caveat: 'Mann–Kendall detects a monotonic trend. It does not measure acceleration or prove the cause of change.',
  };
}
