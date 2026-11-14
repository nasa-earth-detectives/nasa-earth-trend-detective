namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Distribución t de Student: valor p bilateral y valor crítico. Hace falta para la prueba t de la
/// pendiente de una regresión lineal, uno de los tres métodos de significancia que nombra el reto.
/// Se implementa aquí (beta incompleta regularizada por fracción continua) para no añadir una
/// dependencia numérica por dos funciones; los resultados se contrastan con SciPy en los tests.
/// </summary>
public static class StudentTDistribution
{
    private const int MaxIterations = 300;
    private const double Epsilon = 1e-14;
    private const double Tiny = 1e-300;

    /// <summary>Probabilidad de observar |T| mayor o igual que |t| con esos grados de libertad.</summary>
    public static double TwoTailedPValue(double t, int degreesOfFreedom)
    {
        if (degreesOfFreedom < 1 || double.IsNaN(t))
        {
            return 1.0;
        }

        if (double.IsInfinity(t))
        {
            return 0.0;
        }

        var x = degreesOfFreedom / (degreesOfFreedom + t * t);
        return Math.Clamp(RegularizedIncompleteBeta(degreesOfFreedom / 2.0, 0.5, x), 0.0, 1.0);
    }

    /// <summary>
    /// Valor t que deja la probabilidad pedida repartida entre las dos colas (0,05 para el 95 %). El
    /// valor p decrece con t, así que basta una bisección: sobra precisión para un intervalo de confianza.
    /// </summary>
    public static double TwoTailedCriticalValue(double tailProbability, int degreesOfFreedom)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(degreesOfFreedom, 1);
        if (!(tailProbability > 0 && tailProbability < 1))
        {
            throw new ArgumentOutOfRangeException(nameof(tailProbability), tailProbability, "Debe estar entre 0 y 1.");
        }

        double low = 0, high = 1;
        while (TwoTailedPValue(high, degreesOfFreedom) > tailProbability)
        {
            high *= 2;
        }

        for (var i = 0; i < 200 && high - low > 1e-12; i++)
        {
            var middle = (low + high) / 2;
            if (TwoTailedPValue(middle, degreesOfFreedom) > tailProbability) low = middle;
            else high = middle;
        }

        return (low + high) / 2;
    }

    /// <summary>I_x(a, b) con la fracción continua de Lentz, usando la simetría para que converja rápido.</summary>
    internal static double RegularizedIncompleteBeta(double a, double b, double x)
    {
        if (x <= 0) return 0;
        if (x >= 1) return 1;

        var logFront = LogGamma(a + b) - LogGamma(a) - LogGamma(b) + a * Math.Log(x) + b * Math.Log(1 - x);
        return x < (a + 1) / (a + b + 2)
            ? Math.Exp(logFront) * ContinuedFraction(a, b, x) / a
            : 1 - Math.Exp(logFront) * ContinuedFraction(b, a, 1 - x) / b;
    }

    private static double ContinuedFraction(double a, double b, double x)
    {
        var c = 1.0;
        var d = 1 - (a + b) * x / (a + 1);
        d = 1 / (Math.Abs(d) < Tiny ? Tiny : d);
        var result = d;
        for (var m = 1; m <= MaxIterations; m++)
        {
            var even = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
            d = 1 + even * d;
            d = 1 / (Math.Abs(d) < Tiny ? Tiny : d);
            c = 1 + even / c;
            if (Math.Abs(c) < Tiny) c = Tiny;
            result *= d * c;

            var odd = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
            d = 1 + odd * d;
            d = 1 / (Math.Abs(d) < Tiny ? Tiny : d);
            c = 1 + odd / c;
            if (Math.Abs(c) < Tiny) c = Tiny;
            var delta = d * c;
            result *= delta;
            if (Math.Abs(delta - 1) < Epsilon) break;
        }

        return result;
    }

    /// <summary>Logaritmo de la función gamma (aproximación de Lanczos, g = 7).</summary>
    private static double LogGamma(double value)
    {
        double[] coefficients =
        [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
            -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
            1.5056327351493116e-7,
        ];
        var x = value - 1;
        var sum = coefficients[0];
        for (var i = 1; i < coefficients.Length; i++)
        {
            sum += coefficients[i] / (x + i);
        }

        var t = x + 7.5;
        return 0.5 * Math.Log(2 * Math.PI) + (x + 0.5) * Math.Log(t) - t + Math.Log(sum);
    }
}
