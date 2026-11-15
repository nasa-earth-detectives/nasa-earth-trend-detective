import type { ClimateVariable } from '../types/climate.types';
import type { DatasetProvenance } from '../types/dataset.types';
import type { Teleconnection } from '../types/teleconnection.types';
import type { SignificanceInput, SignificancePresentation } from '../utils/detectiveAnalysis';
import type { RegionalBiomeInfo } from '../utils/regionalContext';
import { getTranslations } from './dictionaries';
import { formatTemplate, intlLocale, localizeUnit } from './format';
import type { Locale } from './types';

function numberFormat(locale: Locale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(intlLocale(locale), options);
}

export function formatHexValueLocalized(value: number, locale: Locale, signed = false): string {
  if (value === 0) return '0';
  const small = Math.abs(value) < 0.0001;
  return numberFormat(locale, {
    ...(small ? { notation: 'scientific' } : {}),
    maximumSignificantDigits: 3,
    ...(signed ? { signDisplay: 'exceptZero' } : {}),
  }).format(value);
}

const DENOMINATOR_MAP: Record<string, Record<Locale, string>> = {
  year: { en: 'year', es: 'año' },
  año: { en: 'year', es: 'año' },
  decade: { en: 'decade', es: 'década' },
  década: { en: 'decade', es: 'década' },
  month: { en: 'month', es: 'mes' },
  mes: { en: 'month', es: 'mes' },
  day: { en: 'day', es: 'día' },
  día: { en: 'day', es: 'día' },
};

export function readableHexUnitLocalized(unit: string, locale: Locale): string {
  const { significance } = getTranslations(locale);
  if (unit === 'slope · undeclared unit' || unit === 'pendiente · unidad no declarada') {
    return significance.undeclaredUnit;
  }
  const translatedBase = localizeUnit(unit, locale);
  return translatedBase.replace(
    /\s*\/\s*(year|decade|month|day|año|década|mes|día)\s*$/u,
    (_match, token: string) => ` ${significance.perLabel} ${DENOMINATOR_MAP[token]?.[locale] ?? token}`,
  );
}

export function describeHexTrendLocalized(
  variable: ClimateVariable,
  slope: number,
  unit: string,
  startYear: number,
  endYear: number,
  locale: Locale,
): string {
  const t = getTranslations(locale);
  const context = t.hexPresentation[variable];
  const s = t.significance;
  const period = formatTemplate(s.betweenYears, { startYear, endYear });
  const isUndeclared = unit.includes('undeclared unit') || unit.includes('unidad no declarada');
  const notice = isUndeclared ? s.undeclaredNotice : '';

  if (slope === 0) {
    return formatTemplate(s.zeroSlope, { heading: context.heading, period, notice, explanation: context.explanation });
  }
  if (isUndeclared) {
    return formatTemplate(s.slopeConnector, {
      heading: context.heading,
      direction: slope > 0 ? s.positiveSlope : s.negativeSlope,
      slope: formatHexValueLocalized(slope, locale, true),
      period,
      notice,
      explanation: context.explanation,
    });
  }
  const verb = slope > 0 ? s.increasesVerb : s.decreasesVerb;
  const readable = readableHexUnitLocalized(unit, locale);
  return `${context.subject} ${verb} ${formatHexValueLocalized(Math.abs(slope), locale)} ${readable} ${period}. ${context.explanation}`;
}

export function describeSignificanceLocalized(
  variable: ClimateVariable,
  mk: SignificanceInput,
  locale: Locale,
): SignificancePresentation {
  const t = getTranslations(locale);
  const s = t.significance;
  const subject = t.hexPresentation[variable];
  const freq = numberFormat(locale, { maximumSignificantDigits: 2 });
  const p = mk.pValue < 0.001 ? '< 0.001' : `= ${freq.format(mk.pValue)}`;

  if (!mk.isSignificant) {
    const sign = mk.sensSlope > 0 ? s.signPositive : mk.sensSlope < 0 ? s.signNegative : s.signZero;
    return {
      tone: 'inconclusive',
      label: s.inconclusiveLabel,
      claim: formatTemplate(s.inconclusiveClaim, { sign }),
      caveat: formatTemplate(s.inconclusiveCaveat, { p }),
    };
  }

  const increase = mk.sensSlope > 0;
  if (mk.survivesPersistence === false) {
    return {
      tone: 'inconclusive',
      label: s.unconfirmedLabel,
      claim: formatTemplate(s.unconfirmedClaim, { direction: increase ? s.increaseWord : s.decreaseWord, p }),
      caveat: s.unconfirmedCaveat,
    };
  }

  return {
    tone: increase ? 'increase' : 'decrease',
    label: increase ? s.sustainedIncrease : s.sustainedDecrease,
    claim: formatTemplate(s.overPeriod, { subject: increase ? subject.increase : subject.decrease, p }),
    caveat: s.sustainedCaveat,
  };
}

export function getRegionalBiomeLocalized(lat: number, lng: number, locale: Locale): RegionalBiomeInfo {
  const { biomes } = getTranslations(locale);
  const absLat = Math.abs(lat);
  if (absLat >= 66.5) return lat > 0 ? biomes.arctic : biomes.antarctic;
  if (absLat <= 23.5) {
    if (lat >= -18 && lat <= 8 && lng >= -78 && lng <= -45) return biomes.amazon;
    if (lat >= -10 && lat <= 8 && lng >= 10 && lng <= 32) return biomes.congo;
    if (lat >= 10 && lat <= 20 && lng >= -18 && lng <= 38) return biomes.sahel;
    if (lat >= -10 && lat <= 15 && lng >= 95 && lng <= 145) return biomes['indo-malay'];
    if (lat >= 18 && lat <= 30 && lng >= -15 && lng <= 55) return biomes['sahara-arabian'];
    return biomes.tropical;
  }
  if (lat > 50 && lat < 66.5) return biomes.boreal;
  return biomes.temperate;
}

export function partialYearNoteLocalized(provenance: DatasetProvenance | null, year: number, locale: Locale): string | null {
  const match = provenance && /^(\d{4})-(\d{2})$/.exec(provenance.lastMonth);
  if (!match || Number(match[1]) !== year || Number(match[2]) >= 12) return null;
  const { readouts } = getTranslations(locale);
  const month = readouts.monthsShort[Number(match[2]) - 1] ?? '';
  return formatTemplate(readouts.throughMonth, { month });
}

export function provenanceLabelLocalized(provenance: DatasetProvenance | null, locale: Locale): string {
  const { readouts } = getTranslations(locale);
  if (!provenance) return readouts.apiFallbackFooter;
  const product = provenance.product.split('·')[0].trim();
  return `${product} · ${provenance.interim ? readouts.interimSource : readouts.officialSource}`;
}

export function localizeTeleconnection(connection: Teleconnection, locale: Locale): Teleconnection {
  const { teleconnectionPairs, teleconnectionRegions } = getTranslations(locale);
  return {
    ...connection,
    name: teleconnectionPairs[connection.id] ?? connection.name,
    from: { ...connection.from, label: teleconnectionRegions[connection.from.label] ?? connection.from.label },
    to: { ...connection.to, label: teleconnectionRegions[connection.to.label] ?? connection.to.label },
  };
}
