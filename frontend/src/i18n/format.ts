import type { Locale } from './types';

export function intlLocale(locale: Locale): string {
  return locale === 'es' ? 'es-CO' : 'en-US';
}

const FORMAT_SPECS = {
  whole: {},
  percent0: { style: 'percent', maximumFractionDigits: 0 },
  maxDec4: { maximumFractionDigits: 4 },
  signedMaxDec3: { maximumFractionDigits: 3, signDisplay: 'exceptZero' },
  sig2: { maximumSignificantDigits: 2 },
  sig3: { maximumSignificantDigits: 3 },
  signedSig3: { maximumSignificantDigits: 3, signDisplay: 'exceptZero' },
  sciSig3: { notation: 'scientific', maximumSignificantDigits: 3 },
  signedSciSig3: { notation: 'scientific', maximumSignificantDigits: 3, signDisplay: 'exceptZero' },
} as const satisfies Record<string, Intl.NumberFormatOptions>;

export type NumberFormatKind = keyof typeof FORMAT_SPECS;

const NUMBER_FORMATTERS = { en: {}, es: {} } as Record<Locale, Record<NumberFormatKind, Intl.NumberFormat>>;

// Pre-build one Intl.NumberFormat per kind/locale at module load so components never allocate formatters on render.
for (const locale of ['en', 'es'] as const) {
  const tag = intlLocale(locale);
  for (const [kind, options] of Object.entries(FORMAT_SPECS) as [NumberFormatKind, Intl.NumberFormatOptions][]) {
    NUMBER_FORMATTERS[locale][kind] = new Intl.NumberFormat(tag, options);
  }
}

/** Formats a numeric value using cached module-level Intl.NumberFormat instances. */
export function formatNumber(value: number, kind: NumberFormatKind, locale: Locale): string {
  return NUMBER_FORMATTERS[locale][kind].format(value);
}

/** Formats statistical significance probabilities consistently across detective panels. */
export function formatProbability(symbol: string, value: number, locale: Locale): string {
  return value < 0.001 ? `${symbol} < 0.001` : `${symbol} = ${formatNumber(value, 'sig2', locale)}`;
}

export function formatTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/** Localizes API unit labels (e.g. "°C Anomaly", "fraction / year") without mutating scientific symbols. */
export function localizeUnit(unit: string, locale: Locale): string {
  if (locale === 'en') return unit;
  return unit
    .replace(/\bAnomaly\b/g, 'Anomalía')
    .replace(/\banomaly\b/g, 'anomalía')
    .replace(/\bfraction\b/gi, 'fracción')
    .replace(/\byear\b/gi, 'año')
    .replace(/\bdecade\b/gi, 'década')
    .replace(/\bmonth\b/gi, 'mes')
    .replace(/\bday\b/gi, 'día')
    .replace(/\bundeclared unit\b/gi, 'unidad no declarada')
    .replace(/\bto\b/gi, 'a');
}

export function formatCoordinatesPair(
  lat: number,
  lng: number,
  decimals: number,
  compass: { north: string; south: string; east: string; west: string },
): string {
  const ns = lat >= 0 ? compass.north : compass.south;
  const ew = lng >= 0 ? compass.east : compass.west;
  return `${Math.abs(lat).toFixed(decimals)}° ${ns} · ${Math.abs(lng).toFixed(decimals)}° ${ew}`;
}
