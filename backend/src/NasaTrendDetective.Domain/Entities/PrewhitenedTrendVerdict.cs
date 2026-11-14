namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Mann-Kendall repetido después de descontar la persistencia de un año al siguiente (preblanqueo).
/// <see cref="Lag1Autocorrelation"/> es cuánto se parece cada año al anterior (de −1 a 1) y
/// <see cref="SampleSize"/> los valores que quedan tras el preblanqueo: uno menos por cada tramo de
/// años seguidos.
/// </summary>
public sealed record PrewhitenedTrendVerdict(
    double Lag1Autocorrelation,
    int SampleSize,
    double ZScore,
    double PValue,
    bool IsSignificant)
{
    /// <summary>Serie demasiado corta, constante o sin años consecutivos: no se puede afirmar nada.</summary>
    public static PrewhitenedTrendVerdict Inconclusive { get; } = new(0, 0, 0, 1, false);
}
