import type { ClimateVariable } from '../types/climate.types';

interface HexPresentation {
  heading: string;
  subject: string;
  increase: string;
  decrease: string;
  explanation: string;
}

/** Describes the measured variable without attributing causality or significance to its sign. */
export const HEX_PRESENTATION: Record<ClimateVariable, HexPresentation> = {
  Gistemp: {
    heading: 'Temperature trend',
    subject: 'The temperature anomaly',
    increase: 'Temperature increase',
    decrease: 'Temperature decrease',
    explanation: 'Rate of change of the temperature anomaly over the period; not the current temperature.',
  },
  ModisNdvi: {
    heading: 'Vegetation trend',
    subject: 'The NDVI index',
    increase: 'NDVI increase',
    decrease: 'NDVI decrease',
    explanation: 'Rate of change of the NDVI vegetation index over the period; not the current NDVI nor confirmation of deforestation.',
  },
  GraceMass: {
    heading: 'Water & ice trend',
    subject: 'Water and ice mass',
    increase: 'Water & ice mass increase',
    decrease: 'Water & ice mass decrease',
    explanation: 'Rate of change of water and ice mass over the period; not a current water quantity.',
  },
  Oco2: {
    heading: 'CO₂ trend',
    subject: 'CO₂ concentration',
    increase: 'CO₂ increase',
    decrease: 'CO₂ decrease',
    explanation: 'Rate of change of CO₂ concentration over the period; not the current concentration.',
  },
};

const regular = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 });
const signedRegular = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const scientific = new Intl.NumberFormat('en-US', { notation: 'scientific', maximumSignificantDigits: 3 });
const signedScientific = new Intl.NumberFormat('en-US', {
  notation: 'scientific', maximumSignificantDigits: 3, signDisplay: 'exceptZero',
});

/** Reading precision does not alter data; zero is reserved for the exact zero value. */
export function formatHexValue(value: number, signed = false): string {
  if (value === 0) return '0';
  const small = Math.abs(value) < 0.0001;
  return (small ? signed ? signedScientific : scientific : signed ? signedRegular : regular).format(value);
}

/** Expands only temporal bases declared by the source; never assumes an annual base. */
export function readableHexUnit(unit: string): string {
  if (unit === 'slope · undeclared unit' || unit === 'pendiente · unidad no declarada') return 'undeclared unit';
  return unit.replace(/\s*\/\s*(year|decade|month|day|año|década|mes|día)\s*$/u, ' per $1');
}

export function describeHexTrend(variable: ClimateVariable, slope: number, unit: string, startYear: number, endYear: number): string {
  const context = HEX_PRESENTATION[variable];
  const period = `between ${startYear} and ${endYear}`;
  const isUndeclared = unit.includes('undeclared unit') || unit.includes('unidad no declarada');
  if (slope === 0) return `${context.heading}: zero slope ${period}. ${isUndeclared ? 'The source does not declare the unit or time base. ' : ''}${context.explanation}`;
  if (isUndeclared) {
    return `${context.heading}: ${slope > 0 ? 'positive' : 'negative'} slope of ${formatHexValue(slope, true)} ${period}. The source does not declare the unit or time base. ${context.explanation}`;
  }
  return `${context.subject} ${slope > 0 ? 'increases' : 'decreases'} ${formatHexValue(Math.abs(slope))} ${readableHexUnit(unit)} ${period}. ${context.explanation}`;
}
