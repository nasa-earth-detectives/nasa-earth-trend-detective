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
    /// Prueba t de la regresión lineal sobre la misma serie: el segundo método que nombra el reto.
    /// Va aparte de los parámetros posicionales para no romper a quien ya construye el veredicto.
    /// </summary>
    public LinearTrendVerdict Linear { get; init; } = LinearTrendVerdict.Inconclusive;

    /// <summary>
    /// El mismo Mann-Kendall después de descontar la persistencia entre años. El veredicto clásico
    /// supone años independientes; éste dice si la tendencia sigue ahí cuando no se supone.
    /// </summary>
    public PrewhitenedTrendVerdict Prewhitened { get; init; } = PrewhitenedTrendVerdict.Inconclusive;
}
