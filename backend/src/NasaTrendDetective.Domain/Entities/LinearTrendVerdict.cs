namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Result of the t-test on a linear regression slope: rate of change per year, its
/// standard error, the t-statistic, the two-tailed p-value, and the 95% confidence interval.
/// </summary>
public sealed record LinearTrendVerdict(
    double Slope,
    double StandardError,
    double TStatistic,
    double PValue,
    double[] ConfidenceInterval95,
    bool IsSignificant)
{
    /// <summary>Series too short or without variation over time: nothing can be concluded.</summary>
    public static LinearTrendVerdict Inconclusive { get; } = new(0, 0, 0, 1, [0, 0], false);
}
