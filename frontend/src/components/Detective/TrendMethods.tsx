/**
 * The other two significance methods named by the challenge, alongside the Mann-Kendall verdict:
 * the slope confidence interval and the t-test of a linear regression. Showing whether both
 * methods agree is worth more than one number: if they disagree, the verdict depends on how you
 * look at it and should be stated.
 */
import type { CellTrend } from '../../hooks/useCellTrend';

const rate = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const twoDigits = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2 });
const probability = (p: number) => (p < 0.001 ? 'p < 0.001' : `p = ${twoDigits.format(p)}`);

function agreement(trend: CellTrend): string | null {
  const { linear } = trend;
  if (!linear) return null;
  if (!trend.isSignificant && !linear.isSignificant) return 'Yes: neither distinguishes the trend from chance.';
  if (trend.isSignificant && linear.isSignificant && Math.sign(trend.sensSlope) === Math.sign(linear.slope)) {
    return 'Yes: both see the same trend.';
  }
  return 'No: the verdict depends on the method. Read with caution.';
}

export function TrendMethods({ trend, unit }: { trend: CellTrend; unit: string }) {
  const { confidenceInterval95: interval, linear } = trend;
  const verdict = agreement(trend);
  if (!interval && !linear) return null;
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
      {verdict && (
        <div>
          <dt>Do both methods agree?</dt>
          <dd>{verdict}</dd>
        </div>
      )}
    </dl>
  );
}
