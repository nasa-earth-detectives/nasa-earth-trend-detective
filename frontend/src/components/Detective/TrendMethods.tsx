/**
 * Supporting context for the Mann-Kendall verdict: the slope confidence interval, the linear
 * regression t-test (the other two methods named by the challenge), and Mann-Kendall after
 * removing year-to-year persistence. Showing whether the verdict holds up is worth more than a
 * single number: if it depends on the method or on assuming independent years, it should be stated.
 */
import type { CellTrend } from '../../hooks/useCellTrend';

const rate = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const twoDigits = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2 });
const probability = (p: number) => (p < 0.001 ? 'p < 0.001' : `p = ${twoDigits.format(p)}`);

function agreement(trend: CellTrend): string | null {
  const { linear, prewhitened } = trend;
  if (!linear) return null;
  if (!trend.isSignificant && !linear.isSignificant) return 'Yes: neither method distinguishes the trend from chance.';
  if (trend.isSignificant && linear.isSignificant && Math.sign(trend.sensSlope) === Math.sign(linear.slope)) {
    if (prewhitened && !prewhitened.isSignificant) {
      return 'With caveats: both methods detect the trend, but it does not pass the persistence correction. '
        + 'It may be a long streak rather than a sustained shift.';
    }
    return prewhitened ? 'Yes: the methods agree and the trend passes the persistence correction.'
      : 'Yes: both show the same trend.';
  }
  return 'No: the verdict depends on the method. Interpret with caution.';
}

/** When r1 is below 0.05 the backend leaves the series untouched: the corrected verdict matches the classic one. */
function persistence(trend: CellTrend): string | null {
  const { prewhitened } = trend;
  if (!prewhitened) return null;
  const r1 = `r₁ = ${twoDigits.format(prewhitened.lag1Autocorrelation)}`;
  if (prewhitened.lag1Autocorrelation < 0.05) return `${r1} · negligible: verdict unchanged`;
  const outcome = prewhitened.isSignificant ? 'remains significant'
    : trend.isSignificant ? 'no longer significant' : 'not significant';
  return `${r1} · ${probability(prewhitened.pValue)} after removal · ${outcome}`;
}

export function TrendMethods({ trend, unit }: { trend: CellTrend; unit: string }) {
  const { confidenceInterval95: interval, linear } = trend;
  const verdict = agreement(trend);
  const persistent = persistence(trend);
  if (!interval && !linear && !persistent) return null;
  return (
    <dl className="inspection-methods">
      {interval && (
        <div>
          <dt>95% confidence interval · Sen</dt>
          <dd>{rate.format(interval[0])} to {rate.format(interval[1])} <span>{unit}</span></dd>
        </div>
      )}
      {linear && (
        <div>
          <dt>t-test · linear regression</dt>
          <dd>{rate.format(linear.slope)} <span>{unit}</span> · {probability(linear.pValue)} · {linear.isSignificant ? 'significant' : 'not significant'}</dd>
        </div>
      )}
      {persistent && (
        <div>
          <dt>Year-to-year persistence · prewhitened Mann–Kendall</dt>
          <dd>{persistent}</dd>
        </div>
      )}
      {verdict && (
        <div>
          <dt>Does the verdict hold up?</dt>
          <dd>{verdict}</dd>
        </div>
      )}
    </dl>
  );
}
