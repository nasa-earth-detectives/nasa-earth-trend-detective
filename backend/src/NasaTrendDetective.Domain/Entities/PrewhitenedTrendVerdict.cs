namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Mann-Kendall rerun after removing year-to-year persistence (prewhitening).
/// <see cref="Lag1Autocorrelation"/> measures how strongly each year resembles the previous one
/// (-1 to 1) and <see cref="SampleSize"/> is the remaining value count after prewhitening: one fewer
/// per contiguous run of years.
/// </summary>
public sealed record PrewhitenedTrendVerdict(
    double Lag1Autocorrelation,
    int SampleSize,
    double ZScore,
    double PValue,
    bool IsSignificant)
{
    /// <summary>Series is too short, constant, or lacks consecutive years: nothing can be concluded.</summary>
    public static PrewhitenedTrendVerdict Inconclusive { get; } = new(0, 0, 0, 1, false);
}
