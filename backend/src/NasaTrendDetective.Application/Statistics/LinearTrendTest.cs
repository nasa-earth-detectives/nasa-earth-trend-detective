using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Prueba t de la pendiente de una regresión lineal por mínimos cuadrados. Es el método paramétrico
/// que el reto nombra junto a Mann-Kendall: responde a la misma pregunta (¿hay tendencia?) suponiendo
/// residuos normales, y da el ritmo de cambio con su intervalo de confianza del 95 %. Tenerlos los dos
/// permite ver si el veredicto depende del método.
/// </summary>
public static class LinearTrendTest
{
    public const double SignificanceLevel = 0.05;

    public static LinearTrendVerdict Calculate(IReadOnlyList<double> values, IReadOnlyList<int> years)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(years);

        var n = values.Count;
        // Con dos puntos la recta pasa exacta por ambos: no quedan grados de libertad para el error.
        if (n < 3 || years.Count != n)
        {
            return LinearTrendVerdict.Inconclusive;
        }

        var meanX = years.Average();
        var meanY = values.Average();
        double sxx = 0, sxy = 0;
        for (var i = 0; i < n; i++)
        {
            sxx += (years[i] - meanX) * (years[i] - meanX);
            sxy += (years[i] - meanX) * (values[i] - meanY);
        }

        if (sxx <= 0)
        {
            return LinearTrendVerdict.Inconclusive;
        }

        var slope = sxy / sxx;
        var intercept = meanY - slope * meanX;
        double residualSum = 0;
        for (var i = 0; i < n; i++)
        {
            var residual = values[i] - (intercept + slope * years[i]);
            residualSum += residual * residual;
        }

        var degreesOfFreedom = n - 2;
        var standardError = Math.Sqrt(residualSum / degreesOfFreedom / sxx);
        if (standardError <= 0)
        {
            // Ajuste perfecto: una recta exacta. La tendencia es cierta si la pendiente no es cero.
            var exact = Math.Round(slope, 6);
            return new LinearTrendVerdict(exact, 0, 0, slope == 0 ? 1 : 0, [exact, exact], slope != 0);
        }

        var t = slope / standardError;
        var pValue = StudentTDistribution.TwoTailedPValue(t, degreesOfFreedom);
        var margin = StudentTDistribution.TwoTailedCriticalValue(SignificanceLevel, degreesOfFreedom) * standardError;
        return new LinearTrendVerdict(
            Math.Round(slope, 6),
            Math.Round(standardError, 6),
            Math.Round(t, 4),
            pValue,
            [Math.Round(slope - margin, 6), Math.Round(slope + margin, 6)],
            pValue < SignificanceLevel);
    }
}
