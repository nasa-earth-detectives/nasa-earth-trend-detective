using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Domain.Entities;

public sealed record StatisticalVerdict(
    double SStatistic,
    double VarianceS,
    double ZScore,
    double PValue,
    double SensSlope,
    double SensSlopePerDecade,
    double[] ConfidenceInterval95,
    TrendDirection Direction,
    TrendSignificance Significance)
{
    public bool IsSignificant => Math.Abs(ZScore) > 1.95996398454 || PValue < 0.05;

    /// <summary>
    /// Linear regression t-test on the same series: the second method named by the challenge.
    /// Kept separate from positional parameters to avoid breaking callers that already construct the verdict.
    /// </summary>
    public LinearTrendVerdict Linear { get; init; } = LinearTrendVerdict.Inconclusive;

    /// <summary>
    /// Same Mann-Kendall test after removing year-to-year persistence. The classic verdict assumes
    /// independent years; this indicates whether the trend still holds when independence is not assumed.
    /// </summary>
    public PrewhitenedTrendVerdict Prewhitened { get; init; } = PrewhitenedTrendVerdict.Inconclusive;
}
