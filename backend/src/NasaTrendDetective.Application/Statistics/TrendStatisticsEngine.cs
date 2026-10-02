using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Motor analítico unificado para calcular el veredicto estadístico completo
/// combinando Mann-Kendall y Sen's Slope para una serie temporal dada.
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
            mk.Significance);
    }
}
