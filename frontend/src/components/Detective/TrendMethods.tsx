/**
 * Supporting context for the Mann-Kendall verdict: the slope confidence interval, the linear
 * regression t-test (the other two methods named by the challenge), and Mann-Kendall after
 * removing year-to-year persistence. Showing whether the verdict holds up is worth more than a
 * single number: if it depends on the method or on assuming independent years, it should be stated.
 */
import type { CellTrend } from '../../hooks/useCellTrend';
import { intlLocale, useI18n, type Translations } from '../../i18n';

function agreement(trend: CellTrend, copy: Translations['inspection']): string | null {
  const { linear, prewhitened } = trend;
  if (!linear) return null;
  if (!trend.isSignificant && !linear.isSignificant) return copy.agreeNeither;
  if (trend.isSignificant && linear.isSignificant && Math.sign(trend.sensSlope) === Math.sign(linear.slope)) {
    if (prewhitened && !prewhitened.isSignificant) return copy.agreeCaveat;
    return prewhitened ? copy.agreeBothAndPrewhitened : copy.agreeBoth;
  }
  return copy.disagreeMethods;
}

/** When r1 is below 0.05 the backend leaves the series untouched: the corrected verdict matches the classic one. */
function persistence(
  trend: CellTrend,
  copy: Translations['inspection'],
  twoDigits: Intl.NumberFormat,
  probability: (p: number) => string,
): string | null {
  const { prewhitened } = trend;
  if (!prewhitened) return null;
  const r1 = `r₁ = ${twoDigits.format(prewhitened.lag1Autocorrelation)}`;
  if (prewhitened.lag1Autocorrelation < 0.05) return `${r1} · ${copy.r1Negligible}`;
  const outcome = prewhitened.isSignificant ? copy.remainsSignificant
    : trend.isSignificant ? copy.noLongerSignificant : copy.notSignificant;
  return `${r1} · ${probability(prewhitened.pValue)} ${copy.afterRemoval} · ${outcome}`;
}

export function TrendMethods({ trend, unit }: { trend: CellTrend; unit: string }) {
  const { locale, t } = useI18n();
  const tag = intlLocale(locale);
  const rate = new Intl.NumberFormat(tag, { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
  const twoDigits = new Intl.NumberFormat(tag, { maximumSignificantDigits: 2 });
  const probability = (p: number) => (p < 0.001 ? 'p < 0.001' : `p = ${twoDigits.format(p)}`);

  const { confidenceInterval95: interval, linear } = trend;
  const verdict = agreement(trend, t.inspection);
  const persistent = persistence(trend, t.inspection, twoDigits, probability);
  if (!interval && !linear && !persistent) return null;
  return (
    <dl className="inspection-methods">
      {interval && (
        <div>
          <dt>{t.inspection.intervalLabel}</dt>
          <dd>{rate.format(interval[0])} {t.inspection.toConnector} {rate.format(interval[1])} <span>{unit}</span></dd>
        </div>
      )}
      {linear && (
        <div>
          <dt>{t.inspection.linearTestLabel}</dt>
          <dd>{rate.format(linear.slope)} <span>{unit}</span> · {probability(linear.pValue)} · {linear.isSignificant ? t.inspection.significant : t.inspection.notSignificant}</dd>
        </div>
      )}
      {persistent && (
        <div>
          <dt>{t.inspection.persistenceLabel}</dt>
          <dd>{persistent}</dd>
        </div>
      )}
      {verdict && (
        <div>
          <dt>{t.inspection.holdsUpLabel}</dt>
          <dd>{verdict}</dd>
        </div>
      )}
    </dl>
  );
}
