namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Student's t-distribution: two-tailed p-value and critical value. Needed for the linear regression
/// slope t-test, one of the three significance methods named by the challenge.
/// Implemented here (regularized incomplete beta via continued fraction) to avoid adding a
/// numerical dependency for two functions; results are cross-checked against SciPy in tests.
/// </summary>
public static class StudentTDistribution
{
    private const int MaxIterations = 300;
    private const double Epsilon = 1e-14;
    private const double Tiny = 1e-300;

    /// <summary>Probability of observing |T| greater than or equal to |t| with those degrees of freedom.</summary>
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
    /// Value t that leaves the requested probability split between both tails (0.05 for 95%). The
    /// p-value decreases with t, so bisection is enough: more than accurate enough for a confidence interval.
    /// </summary>
    public static double TwoTailedCriticalValue(double tailProbability, int degreesOfFreedom)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(degreesOfFreedom, 1);
        if (!(tailProbability > 0 && tailProbability < 1))
        {
            throw new ArgumentOutOfRangeException(nameof(tailProbability), tailProbability, "Must be between 0 and 1.");
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

    /// <summary>I_x(a, b) with Lentz's continued fraction, using symmetry for fast convergence.</summary>
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

    /// <summary>Logarithm of the gamma function (Lanczos approximation, g = 7).</summary>
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
