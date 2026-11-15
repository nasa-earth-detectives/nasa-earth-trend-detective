using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Quality metrics for a variable following the cleaning stage: locatable observations
/// (valid coordinates and timestamp), valid before imputation, imputed, and valid after.
/// </summary>
public sealed record DataQualityMetrics(
    ClimateVariable Variable,
    long TotalObservations,
    long ValidBeforeImputation,
    long ImputedValues,
    long ValidAfterImputation)
{
    public long NullAfterImputation => TotalObservations - ValidAfterImputation;

    /// <summary>
    /// Percentage (0-100) of valid values before imputation.
    /// </summary>
    public double ValidPercentBeforeImputation => Percent(ValidBeforeImputation);

    /// <summary>
    /// Percentage (0-100) of valid values after imputation.
    /// </summary>
    public double ValidPercentAfterImputation => Percent(ValidAfterImputation);

    private double Percent(long count) =>
        TotalObservations == 0 ? 0 : Math.Round(100.0 * count / TotalObservations, 2);
}
