using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Computational engine for the non-parametric Mann-Kendall trend test with tie correction.
/// Adheres to NASA scientific rigor specifications.
/// </summary>
public static class MannKendallCalculator
{
    public const double ZCritical95 = 1.95996398454;

    public sealed record MannKendallOutput(
        double S,
        double VarianceS,
        double ZScore,
        double PValue,
        TrendDirection Direction,
        TrendSignificance Significance);

    public static MannKendallOutput Calculate(IReadOnlyList<double> values)
    {
        ArgumentNullException.ThrowIfNull(values);

        var n = values.Count;
        if (n < 3)
        {
            return new MannKendallOutput(0, 0, 0, 1.0, TrendDirection.Stable, TrendSignificance.NonSignificant);
        }

        // 1. Trend Statistic S
        double s = 0;
        for (var k = 0; k < n - 1; k++)
        {
            for (var j = k + 1; j < n; j++)
            {
                var diff = values[j] - values[k];
                if (diff > 0.0000001) s += 1.0;
                else if (diff < -0.0000001) s -= 1.0;
            }
        }

        // 2. Variance Var(S) with tie correction
        var tieSum = CalculateTieCorrection(values);
        var varS = (n * (n - 1.0) * (2.0 * n + 5.0) - tieSum) / 18.0;

        if (varS <= 0.0)
        {
            return new MannKendallOutput(s, 0, 0, 1.0, TrendDirection.Stable, TrendSignificance.NonSignificant);
        }

        // 3. Standardized Z-score
        var stdDev = Math.Sqrt(varS);
        double z;
        if (s > 0) z = (s - 1.0) / stdDev;
        else if (s < 0) z = (s + 1.0) / stdDev;
        else z = 0.0;

        // 4. P-value and scientific verdict at 95% confidence (|Z| > 1.96)
        var pValue = NormalDistribution.CalculateTwoTailedPValue(z);
        var isSignificant = Math.Abs(z) > ZCritical95;

        TrendDirection direction;
        TrendSignificance significance;

        if (isSignificant)
        {
            if (z > 0)
            {
                direction = TrendDirection.Increasing;
                significance = TrendSignificance.SignificantlyIncreasing;
            }
            else
            {
                direction = TrendDirection.Decreasing;
                significance = TrendSignificance.SignificantlyDecreasing;
            }
        }
        else
        {
            direction = TrendDirection.Stable;
            significance = TrendSignificance.NonSignificant;
        }

        return new MannKendallOutput(s, varS, z, pValue, direction, significance);
    }

    private static double CalculateTieCorrection(IReadOnlyList<double> values)
    {
        var tieGroups = values
            .GroupBy(v => Math.Round(v, 6))
            .Where(g => g.Count() > 1);

        double tieSum = 0;
        foreach (var group in tieGroups)
        {
            var t = (double)group.Count();
            tieSum += t * (t - 1.0) * (2.0 * t + 5.0);
        }

        return tieSum;
    }
}
