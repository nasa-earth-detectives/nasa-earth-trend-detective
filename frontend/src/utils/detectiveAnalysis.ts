/**
 * detectiveAnalysis.ts
 * Scientific utilities for formatting coordinates and reading the Mann-Kendall / Sen
 * verdict in plain language, without claiming more than the test proves.
 */

import type { ClimateVariable } from '../types/climate.types';
import { HEX_PRESENTATION } from '../config/hexPresentation';

export function formatCoordinate(val: number, posChar: string, negChar: string): string {
  const dir = val >= 0 ? posChar : negChar;
  return `${Math.abs(val).toFixed(2)}° ${dir}`;
}

/** Three possible states. "Inconclusive change" does not mean "no change". */
export type SignificanceTone = 'increase' | 'decrease' | 'inconclusive';

export interface SignificancePresentation {
  tone: SignificanceTone;
  label: string;
  /** What can be stated from these data. */
  claim: string;
  /** What cannot be stated and why. */
  caveat: string;
}

/** Minimum inputs needed for reading: works for both the card and a grid cell. */
export interface SignificanceInput {
  isSignificant: boolean;
  pValue: number;
  sensSlope: number;
  /** Mann-Kendall Z-score; shown if provided by the source. */
  zScore?: number;
  /** false if the trend fails prewhitened Mann-Kendall; undefined if not computed. */
  survivesPersistence?: boolean;
}

const frequency = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2 });

export function describeSignificance(variable: ClimateVariable, mk: SignificanceInput): SignificancePresentation {
  const subject = HEX_PRESENTATION[variable];
  const p = mk.pValue < 0.001 ? '< 0.001' : `= ${frequency.format(mk.pValue)}`;

  if (!mk.isSignificant) {
    return {
      tone: 'inconclusive',
      label: 'Inconclusive change',
      claim: `The slope sign is ${mk.sensSlope > 0 ? 'positive' : mk.sensSlope < 0 ? 'negative' : 'zero'}, `
        + 'but the test does not distinguish it from random chance at 95% confidence.',
      caveat: `A p-value ${p} greater than 0.05 does not prove there is no change: it proves this series alone is not enough to establish one. `
        + 'With more years or less noise, the verdict could change.',
    };
  }

  const increase = mk.sensSlope > 0;
  if (mk.survivesPersistence === false) {
    return {
      tone: 'inconclusive',
      label: 'Unconfirmed trend',
      claim: `The classic test detects ${increase ? 'an increase' : 'a decrease'} (p ${p}), `
        + 'but no longer detects it after accounting for year-to-year persistence.',
      caveat: 'It may be a long streak rather than a sustained shift. With more years, the verdict could be confirmed.',
    };
  }

  return {
    tone: increase ? 'increase' : 'decrease',
    label: increase ? 'Sustained increase' : 'Sustained decrease',
    claim: `${increase ? subject.increase : subject.decrease} over the period (p ${p}).`,
    caveat: 'Mann–Kendall detects a monotonic trend. It does not measure acceleration or prove the cause of the change.',
  };
}
