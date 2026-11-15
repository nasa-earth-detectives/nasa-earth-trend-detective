using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Iterative prewhitened Mann-Kendall test (Zhang et al., 2000; Wang and Swail, 2001). The classic
/// test assumes each year is independent of the previous one. Under persistence (a dry year tends to
/// follow another dry year), it mistakes streaks for trends and produces false positives. Here, trend
/// and lag-1 autocorrelation r1 are estimated jointly, each year's carryover from the prior year is
/// removed via w(t) = (x(t) - r1 * x(t - 1)) / (1 - r1), and the test is rerun on w.
///
/// Method choice: five variants were benchmarked on 2,000 simulated series per case (AR(1) with phi
/// from 0 to 0.7; 25 and 45 years; 5% nominal level). False positives without a trend: classic 4-38%;
/// Yue (2002) trend-free prewhitening 5-50%; this method 3.5-19% (cuts them roughly in half). Simple
/// von Storch (1995) prewhitening stays near 5% but erases real trends (detects 55% of a strong
/// trend at phi = 0.5 over 45 years vs. 99.9% here) because it estimates r1 before detrending.
///
/// Rejected variant: small-sample r1 bias correction, (n * r1 + 2) / (n - 4). In simulation it
/// lowered false positives to 3-9%, but on real 21-to-26-year series the iteration hit the r1 cap
/// and erased clear signals (northern India groundwater depletion in GRACE jumped from p = 7e-8 to
/// p = 0.89).
///
/// The loop works on plain arrays with reused buffers and takes each median with quickselect: the
/// first version (LINQ plus a full sort per iteration) was 70 % of the trend-grid statistics.
/// </summary>
public static class PrewhiteningTrendTest
{
    /// <summary>With fewer years, r1 cannot be estimated meaningfully.</summary>
    public const int MinYears = 8;

    /// <summary>Minimum consecutive year pairs; gaps in the series do not count.</summary>
    public const int MinConsecutivePairs = 5;

    /// <summary>Below this r1, persistence is negligible and the series is left untouched.</summary>
    public const double NegligibleAutocorrelation = 0.05;

    private const double MaxAutocorrelation = 0.95; // near r1 = 1, dividing by (1 - r1) blows up
    private const int MaxIterations = 50;
    private const double Tolerance = 1e-4;
    private const double NoiseFloor = 1e-12; // fraction of original variance below which only rounding remains

    public static PrewhitenedTrendVerdict Calculate(IReadOnlyList<double> values, IReadOnlyList<int> years)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(years);

        var count = values.Count;
        if (count != years.Count || count < MinYears)
        {
            return PrewhitenedTrendVerdict.Inconclusive;
        }

        var series = values as double[] ?? [.. values];
        var time = years as int[] ?? [.. years];

        // Only consecutive year pairs count. Across a gap (e.g., 2017-2018 between GRACE and GRACE-FO),
        // the preceding point is not "last year" and there is no one-step carryover to subtract.
        var pairs = new int[count - 1];
        var pairCount = 0;
        for (var i = 0; i < count - 1; i++)
        {
            if (time[i + 1] - time[i] == 1)
            {
                pairs[pairCount++] = i;
            }
        }

        if (pairCount < MinConsecutivePairs)
        {
            return PrewhitenedTrendVerdict.Inconclusive;
        }

        var lag1 = Lag1(series, pairs, pairCount, out var spread);
        if (lag1 < NegligibleAutocorrelation)
        {
            return Verdict(series, lag1);
        }

        lag1 = Math.Min(lag1, MaxAutocorrelation);
        var whitenedTimes = new int[pairCount];
        for (var p = 0; p < pairCount; p++)
        {
            whitenedTimes[p] = time[pairs[p] + 1];
        }

        var whitened = new double[pairCount];
        var detrended = new double[count];
        var slopes = new double[pairCount * (pairCount - 1) / 2];

        Whiten(series, pairs, pairCount, lag1, whitened);
        var slope = OrderStatistics.MedianPairwiseSlope(whitened, whitenedTimes, pairCount, slopes);

        for (var iteration = 0; iteration < MaxIterations; iteration++)
        {
            // Estimate r1 on the DETRENDED series; otherwise the trend itself inflates it.
            for (var i = 0; i < count; i++)
            {
                detrended[i] = series[i] - slope * time[i];
            }

            var residual = Lag1(detrended, pairs, pairCount, out var residualSpread);
            if (residualSpread <= NoiseFloor * spread)
            {
                return Verdict(series, 0.0); // exact line: after detrending, nothing remains to measure
            }

            var next = Math.Min(residual, MaxAutocorrelation);
            if (next < NegligibleAutocorrelation)
            {
                return Verdict(series, next);
            }

            Whiten(series, pairs, pairCount, next, whitened);
            var nextSlope = OrderStatistics.MedianPairwiseSlope(whitened, whitenedTimes, pairCount, slopes);
            var converged = Math.Abs(next - lag1) <= Tolerance
                && Math.Abs(nextSlope - slope) <= Tolerance * Math.Max(Math.Abs(slope), 1e-12);
            (lag1, slope) = (next, nextSlope);
            if (converged)
            {
                break;
            }
        }

        return Verdict(whitened, lag1);
    }

    private static PrewhitenedTrendVerdict Verdict(double[] series, double lag1)
    {
        var mannKendall = MannKendallCalculator.Calculate(series);
        return new PrewhitenedTrendVerdict(lag1, series.Length, mannKendall.ZScore, mannKendall.PValue,
            Math.Abs(mannKendall.ZScore) > MannKendallCalculator.ZCritical95);
    }

    /// <summary>
    /// One-step autocorrelation using the overall series mean. The (n - 1) / pairs factor equals 1
    /// when there are no gaps (standard estimator) and compensates for missing cross-products across gaps.
    /// </summary>
    private static double Lag1(double[] series, int[] pairs, int pairCount, out double sumOfSquares)
    {
        var total = 0.0;
        for (var i = 0; i < series.Length; i++)
        {
            total += series[i];
        }

        var mean = total / series.Length;
        sumOfSquares = 0.0;
        for (var i = 0; i < series.Length; i++)
        {
            sumOfSquares += (series[i] - mean) * (series[i] - mean);
        }

        if (sumOfSquares <= 0.0)
        {
            return 0.0; // constant series: no persistence to measure
        }

        var crossProducts = 0.0;
        for (var p = 0; p < pairCount; p++)
        {
            var i = pairs[p];
            crossProducts += (series[i] - mean) * (series[i + 1] - mean);
        }

        return crossProducts / sumOfSquares * (series.Length - 1) / pairCount;
    }

    /// <summary>Dividing by (1 - r1) preserves the original slope; without it, prewhitening shrinks it.</summary>
    private static void Whiten(double[] series, int[] pairs, int pairCount, double lag1, double[] whitened)
    {
        for (var p = 0; p < pairCount; p++)
        {
            var i = pairs[p];
            whitened[p] = (series[i + 1] - lag1 * series[i]) / (1.0 - lag1);
        }
    }
}
