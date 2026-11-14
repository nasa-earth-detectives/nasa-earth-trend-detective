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
        // Only consecutive year pairs count. Across a gap (e.g., 2017-2018 between GRACE and GRACE-FO),
        // the preceding point is not "last year" and there is no one-step carryover to subtract.
        var pairs = Enumerable.Range(0, Math.Max(count - 1, 0)).Where(i => years[i + 1] - years[i] == 1).ToArray();
        if (count != years.Count || count < MinYears || pairs.Length < MinConsecutivePairs)
        {
            return PrewhitenedTrendVerdict.Inconclusive;
        }

        var lag1 = Lag1(values, pairs, out var spread);
        if (lag1 < NegligibleAutocorrelation)
        {
            return Verdict(values, lag1);
        }

        lag1 = Math.Min(lag1, MaxAutocorrelation);
        var times = pairs.Select(i => years[i + 1]).ToArray();
        var whitened = Whiten(values, pairs, lag1);
        var slope = MedianSlope(whitened, times);

        for (var iteration = 0; iteration < MaxIterations; iteration++)
        {
            // Estimate r1 on the DETRENDED series; otherwise the trend itself inflates it.
            var detrended = values.Select((value, i) => value - slope * years[i]).ToArray();
            var residual = Lag1(detrended, pairs, out var residualSpread);
            if (residualSpread <= NoiseFloor * spread)
            {
                return Verdict(values, 0.0); // exact line: after detrending, nothing remains to measure
            }

            var next = Math.Min(residual, MaxAutocorrelation);
            if (next < NegligibleAutocorrelation)
            {
                return Verdict(values, next);
            }

            whitened = Whiten(values, pairs, next);
            var nextSlope = MedianSlope(whitened, times);
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

    private static PrewhitenedTrendVerdict Verdict(IReadOnlyList<double> series, double lag1)
    {
        var mannKendall = MannKendallCalculator.Calculate(series);
        return new PrewhitenedTrendVerdict(lag1, series.Count, mannKendall.ZScore, mannKendall.PValue,
            Math.Abs(mannKendall.ZScore) > MannKendallCalculator.ZCritical95);
    }

    /// <summary>
    /// One-step autocorrelation using the overall series mean. The (n - 1) / pairs factor equals 1
    /// when there are no gaps (standard estimator) and compensates for missing cross-products across gaps.
    /// </summary>
    private static double Lag1(IReadOnlyList<double> series, int[] pairs, out double sumOfSquares)
    {
        var mean = series.Average();
        sumOfSquares = series.Sum(value => (value - mean) * (value - mean));
        if (sumOfSquares <= 0.0)
        {
            return 0.0; // constant series: no persistence to measure
        }

        var crossProducts = pairs.Sum(i => (series[i] - mean) * (series[i + 1] - mean));
        return crossProducts / sumOfSquares * (series.Count - 1) / pairs.Length;
    }

    /// <summary>Dividing by (1 - r1) preserves the original slope; without it, prewhitening shrinks it.</summary>
    private static double[] Whiten(IReadOnlyList<double> values, int[] pairs, double lag1) =>
        pairs.Select(i => (values[i + 1] - lag1 * values[i]) / (1.0 - lag1)).ToArray();

    /// <summary>Unrounded Sen's slope: the loop needs more than the 6 decimals exposed by the API.</summary>
    private static double MedianSlope(double[] series, int[] times)
    {
        var slopes = new List<double>(series.Length * (series.Length - 1) / 2);
        for (var k = 0; k < series.Length - 1; k++)
        {
            for (var j = k + 1; j < series.Length; j++)
            {
                slopes.Add((series[j] - series[k]) / (times[j] - times[k]));
            }
        }

        slopes.Sort();
        var middle = slopes.Count / 2;
        return slopes.Count % 2 == 1 ? slopes[middle] : (slopes[middle - 1] + slopes[middle]) / 2.0;
    }
}
