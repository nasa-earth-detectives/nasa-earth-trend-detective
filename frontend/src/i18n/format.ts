import type { Locale } from './types';

export function intlLocale(locale: Locale): string {
  return locale === 'es' ? 'es-CO' : 'en-US';
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
