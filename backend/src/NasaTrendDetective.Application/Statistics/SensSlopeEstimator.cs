namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Estimador no paramétrico de Pendiente de Sen (Sen's Slope).
/// Calcula la mediana de las tasas de cambio de todos los pares temporales e intervalos de confianza.
/// </summary>
public static class SensSlopeEstimator
{
    public sealed record SensSlopeOutput(
        double Slope,
        double SlopePerDecade,
        (double Lower, double Upper) ConfidenceInterval95);

    public static SensSlopeOutput Estimate(IReadOnlyList<double> values, IReadOnlyList<int>? years = null, double varianceS = 0)
    {
        ArgumentNullException.ThrowIfNull(values);

        var n = values.Count;
        if (n < 2)
        {
            return new SensSlopeOutput(0, 0, (0, 0));
        }

        var slopes = new List<double>((n * (n - 1)) / 2);

        for (var k = 0; k < n - 1; k++)
        {
            var yK = years != null && years.Count == n ? years[k] : k;
            var xK = values[k];

            for (var j = k + 1; j < n; j++)
            {
                var yJ = years != null && years.Count == n ? years[j] : j;
                var xJ = values[j];
                var dt = yJ - yK;

                if (dt != 0)
                {
                    slopes.Add((xJ - xK) / (double)dt);
                }
            }
        }

        if (slopes.Count == 0)
        {
            return new SensSlopeOutput(0, 0, (0, 0));
        }

        slopes.Sort();
        var total = slopes.Count;
        double medianSlope;

        if (total % 2 == 1)
        {
            medianSlope = slopes[total / 2];
        }
        else
        {
            medianSlope = (slopes[(total / 2) - 1] + slopes[total / 2]) / 2.0;
        }

        // Intervalo de Confianza al 95% usando Var(S)
        (double Lower, double Upper) ci = (medianSlope, medianSlope);
        if (varianceS > 0)
        {
            var cAlpha = MannKendallCalculator.ZCritical95 * Math.Sqrt(varianceS);
            var lowerIndex = Math.Clamp((int)Math.Floor((total - cAlpha) / 2.0), 0, total - 1);
            var upperIndex = Math.Clamp((int)Math.Floor((total + cAlpha) / 2.0), 0, total - 1);
            ci = (slopes[lowerIndex], slopes[upperIndex]);
        }

        return new SensSlopeOutput(
            Math.Round(medianSlope, 6),
            Math.Round(medianSlope * 10.0, 6),
            (Math.Round(ci.Lower, 6), Math.Round(ci.Upper, 6)));
    }
}
