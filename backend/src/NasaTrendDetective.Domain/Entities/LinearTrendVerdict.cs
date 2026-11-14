namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Resultado de la prueba t sobre la pendiente de una regresión lineal: ritmo de cambio por año, su
/// error estándar, el estadístico t, el valor p bilateral y el intervalo de confianza del 95 %.
/// </summary>
public sealed record LinearTrendVerdict(
    double Slope,
    double StandardError,
    double TStatistic,
    double PValue,
    double[] ConfidenceInterval95,
    bool IsSignificant)
{
    /// <summary>Serie demasiado corta o sin variación en el tiempo: no se puede afirmar nada.</summary>
    public static LinearTrendVerdict Inconclusive { get; } = new(0, 0, 0, 1, [0, 0], false);
}
