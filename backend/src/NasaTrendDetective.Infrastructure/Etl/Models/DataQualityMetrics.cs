using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Métricas de calidad de una variable tras la etapa de limpieza: observaciones ubicables
/// (coordenadas y tiempo válidos), válidas antes de imputar, imputadas y válidas después.
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
    /// Porcentaje (0-100) de valores válidos antes de la imputación.
    /// </summary>
    public double ValidPercentBeforeImputation => Percent(ValidBeforeImputation);

    /// <summary>
    /// Porcentaje (0-100) de valores válidos después de la imputación.
    /// </summary>
    public double ValidPercentAfterImputation => Percent(ValidAfterImputation);

    private double Percent(long count) =>
        TotalObservations == 0 ? 0 : Math.Round(100.0 * count / TotalObservations, 2);
}
