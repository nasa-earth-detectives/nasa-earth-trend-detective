using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Motor analítico unificado para calcular el veredicto estadístico completo de una serie:
/// Mann-Kendall con la pendiente de Sen (no paramétrico), la prueba t de la regresión lineal y el
/// Mann-Kendall con preblanqueo, que descuenta la persistencia entre años.
/// </summary>
public static class TrendStatisticsEngine
{
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
