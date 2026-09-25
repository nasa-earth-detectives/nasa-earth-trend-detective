import type { ClimateVariable } from '../types/climate.types';

interface HexPresentation {
  heading: string;
  subject: string;
  increase: string;
  decrease: string;
  explanation: string;
}

/** Describe la variable medida sin atribuir causas o significancia a su signo. */
export const HEX_PRESENTATION: Record<ClimateVariable, HexPresentation> = {
  Gistemp: {
    heading: 'Tendencia de temperatura',
    subject: 'La anomalía de temperatura',
    increase: 'Aumento de temperatura',
    decrease: 'Descenso de temperatura',
    explanation: 'Ritmo de cambio de la anomalía de temperatura durante el periodo; no es la temperatura actual.',
  },
  ModisNdvi: {
    heading: 'Tendencia de vegetación',
    subject: 'El índice NDVI',
    increase: 'Aumento de NDVI',
    decrease: 'Descenso de NDVI',
    explanation: 'Ritmo de cambio del índice de vegetación NDVI durante el periodo; no es el NDVI actual ni confirma deforestación.',
  },
  GraceMass: {
    heading: 'Tendencia de agua y hielo',
    subject: 'La masa de agua y hielo',
    increase: 'Aumento de masa de agua y hielo',
    decrease: 'Descenso de masa de agua y hielo',
    explanation: 'Ritmo de cambio de la masa de agua y hielo durante el periodo; no es una cantidad de agua actual.',
  },
  Oco2: {
    heading: 'Tendencia de CO₂',
    subject: 'La concentración de CO₂',
    increase: 'Aumento de CO₂',
    decrease: 'Descenso de CO₂',
    explanation: 'Ritmo de cambio de la concentración de CO₂ durante el periodo; no es la concentración actual.',
  },
};

const regular = new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 3 });
const signedRegular = new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const scientific = new Intl.NumberFormat('es-CO', { notation: 'scientific', maximumSignificantDigits: 3 });
const signedScientific = new Intl.NumberFormat('es-CO', {
  notation: 'scientific', maximumSignificantDigits: 3, signDisplay: 'exceptZero',
});

/** La precisión de lectura no altera los datos; cero se reserva para el valor cero exacto. */
export function formatHexValue(value: number, signed = false): string {
  if (value === 0) return '0';
  const small = Math.abs(value) < 0.0001;
  return (small ? signed ? signedScientific : scientific : signed ? signedRegular : regular).format(value);
}

/** Expande sólo bases temporales declaradas por la fuente; nunca presupone una base anual. */
export function readableHexUnit(unit: string): string {
  if (unit === 'pendiente · unidad no declarada') return 'unidad no declarada';
  return unit.replace(/\s*\/\s*(año|década|mes|día)\s*$/u, ' por $1');
}

export function describeHexTrend(variable: ClimateVariable, slope: number, unit: string, startYear: number, endYear: number): string {
  const context = HEX_PRESENTATION[variable];
  const period = `entre ${startYear} y ${endYear}`;
  if (slope === 0) return `${context.heading}: pendiente cero ${period}. ${unit.includes('unidad no declarada') ? 'La fuente no declara la unidad ni la base temporal. ' : ''}${context.explanation}`;
  if (unit.includes('unidad no declarada')) {
    return `${context.heading}: pendiente ${slope > 0 ? 'positiva' : 'negativa'} de ${formatHexValue(slope, true)} ${period}. La fuente no declara la unidad ni la base temporal. ${context.explanation}`;
  }
  return `${context.subject} ${slope > 0 ? 'aumenta' : 'disminuye'} ${formatHexValue(Math.abs(slope))} ${readableHexUnit(unit)} ${period}. ${context.explanation}`;
}
