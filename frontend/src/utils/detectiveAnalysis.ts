/**
 * detectiveAnalysis.ts
 * Utilidades científicas para el formateo de coordenadas y la lectura del veredicto
 * Mann-Kendall / Sen en lenguaje llano, sin prometer más de lo que prueba el test.
 */

import type { ClimateVariable } from '../types/climate.types';
import { HEX_PRESENTATION } from '../config/hexPresentation';

export function formatCoordinate(val: number, posChar: string, negChar: string): string {
  const dir = val >= 0 ? posChar : negChar;
  return `${Math.abs(val).toFixed(2)}° ${dir}`;
}

/** Tres estados posibles. "Sin cambio concluyente" no equivale a "no cambia". */
export type SignificanceTone = 'increase' | 'decrease' | 'inconclusive';

export interface SignificancePresentation {
  tone: SignificanceTone;
  label: string;
  /** Qué se puede afirmar con estos datos. */
  claim: string;
  /** Qué no se puede afirmar y por qué. */
  caveat: string;
}

/** Lo mínimo que necesita la lectura: sirve para la tarjeta y para una celda de la grilla. */
export interface SignificanceInput {
  isSignificant: boolean;
  pValue: number;
  sensSlope: number;
  /** Puntuación Z de Mann-Kendall; se muestra si la fuente la entrega. */
  zScore?: number;
  /** false si la tendencia no supera el Mann-Kendall con preblanqueo; undefined si no se calculó. */
  survivesPersistence?: boolean;
}

const frequency = new Intl.NumberFormat('es', { maximumSignificantDigits: 2 });

export function describeSignificance(variable: ClimateVariable, mk: SignificanceInput): SignificancePresentation {
  const subject = HEX_PRESENTATION[variable];
  const p = mk.pValue < 0.001 ? '< 0,001' : `= ${frequency.format(mk.pValue)}`;

  if (!mk.isSignificant) {
    return {
      tone: 'inconclusive',
      label: 'Sin cambio concluyente',
      claim: `El signo de la pendiente es ${mk.sensSlope > 0 ? 'positivo' : mk.sensSlope < 0 ? 'negativo' : 'cero'}, `
        + 'pero el test no lo distingue del azar con 95 % de confianza.',
      caveat: `Un p-valor ${p} mayor que 0,05 no prueba que no haya cambio: prueba que esta serie no basta para afirmarlo. `
        + 'Con más años o menos ruido el veredicto podría cambiar.',
    };
  }

  const increase = mk.sensSlope > 0;
  if (mk.survivesPersistence === false) {
    return {
      tone: 'inconclusive',
      label: 'Tendencia sin confirmar',
      claim: `El test clásico ve ${increase ? 'un aumento' : 'un descenso'} (p ${p}), `
        + 'pero deja de verlo al descontar la persistencia de un año al siguiente.',
      caveat: 'Puede ser una racha larga y no un cambio sostenido. Con más años el veredicto podría confirmarse.',
    };
  }

  return {
    tone: increase ? 'increase' : 'decrease',
    label: increase ? 'Aumento sostenido' : 'Descenso sostenido',
    claim: `${increase ? subject.increase : subject.decrease} durante el periodo (p ${p}).`,
    caveat: 'Mann–Kendall detecta una tendencia monótona. No mide aceleración ni demuestra la causa del cambio.',
  };
}
