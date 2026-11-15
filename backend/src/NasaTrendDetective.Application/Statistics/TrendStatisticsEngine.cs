using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Unified analytical engine to compute the full statistical verdict for a series:
/// non-parametric Mann-Kendall with Sen's slope, the linear regression t-test, and
/// prewhitened Mann-Kendall that removes year-to-year persistence.
/// </summary>
public static class TrendStatisticsEngine
{
    /// <summary>Exactly what one cell of the trend grid reports.</summary>
    public readonly record struct CellVerdict(
        double SensSlope,
        double SensSlopePerDecade,
        double ZScore,
        double PValue,
        bool IsSignificant,
        TrendDirection Direction,
        double PrewhitenedPValue);

    /// <summary>
    /// Verdict for one cell of the trend grid. Same numbers as <see cref="Analyze"/> for the fields the
    /// grid returns, without what it never sends: the regression t-test and the confidence interval of
    /// Sen's slope (which needs every pairwise slope sorted). The grid runs this up to 16,200 times per
    /// request; the single-cell endpoint keeps using the full analysis.
    /// </summary>
    public static CellVerdict AnalyzeCell(IReadOnlyList<AnnualObservation> observations)
    {
        ArgumentNullException.ThrowIfNull(observations);

        var count = observations.Count;
        var values = new double[count];
        var years = new int[count];
        var ordered = true;
        for (var i = 0; i < count; i++)
        {
            var observation = observations[i];
            values[i] = observation.Anomaly ?? observation.Value;
            years[i] = observation.Year;
            ordered &= i == 0 || years[i] >= years[i - 1];
        }

        if (!ordered)
        {
            Array.Sort(years, values);
        }

        var mk = MannKendallCalculator.Calculate(values);
        var slope = count < 2
            ? 0.0
            : OrderStatistics.MedianPairwiseSlope(values, years, count, new double[count * (count - 1) / 2]);

        return new CellVerdict(
            Math.Round(slope, 6),
            Math.Round(slope * 10.0, 6),
            mk.ZScore,
            mk.PValue,
            Math.Abs(mk.ZScore) > MannKendallCalculator.ZCritical95 || mk.PValue < 0.05,
            mk.Direction,
            PrewhiteningTrendTest.Calculate(values, years).PValue);
    }

    public static StatisticalVerdict Analyze(IReadOnlyList<AnnualObservation> observations)
    {
        ArgumentNullException.ThrowIfNull(observations);

        var sorted = observations.OrderBy(o => o.Year).ToList();
        var values = sorted.Select(o => o.Anomaly ?? o.Value).ToList();
        var years = sorted.Select(o => o.Year).ToList();

        var mk = MannKendallCalculator.Calculate(values);
        var sens = SensSlopeEstimator.Estimate(values, years, mk.VarianceS);

        return new StatisticalVerdict(
            mk.S,
            mk.VarianceS,
            mk.ZScore,
            mk.PValue,
            sens.Slope,
            sens.SlopePerDecade,
            new[] { sens.ConfidenceInterval95.Lower, sens.ConfidenceInterval95.Upper },
            mk.Direction,
            mk.Significance)
        {
            Linear = LinearTrendTest.Calculate(values, years),
            Prewhitened = PrewhiteningTrendTest.Calculate(values, years)
        };
    }
}
