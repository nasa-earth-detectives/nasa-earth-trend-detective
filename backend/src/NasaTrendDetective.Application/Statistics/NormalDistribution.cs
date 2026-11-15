namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Standard normal distribution functions and numerical significance (p-value) calculation.
/// High-precision implementation based on Abramowitz & Stegun approximation (error &lt; 1.5e-7).
/// </summary>
public static class NormalDistribution
{
    private const double P = 0.2316419;
    private const double B1 = 0.319381530;
    private const double B2 = -0.356563782;
    private const double B3 = 1.781477937;
    private const double B4 = -1.821255978;
    private const double B5 = 1.330274429;
    private static readonly double InvSqrt2Pi = 1.0 / Math.Sqrt(2.0 * Math.PI);

    /// <summary>
    /// Standard cumulative distribution function Φ(z).
    /// </summary>
    public static double Cdf(double z)
    {
        var absZ = Math.Abs(z);
        var t = 1.0 / (1.0 + P * absZ);
        var poly = t * (B1 + t * (B2 + t * (B3 + t * (B4 + t * B5))));
        var phi = 1.0 - InvSqrt2Pi * Math.Exp(-0.5 * absZ * absZ) * poly;

        return z >= 0.0 ? phi : 1.0 - phi;
    }

    /// <summary>
    /// Computes the two-tailed p-value for a standardized Z-score.
    /// </summary>
    public static double CalculateTwoTailedPValue(double z)
    {
        if (double.IsNaN(z) || double.IsInfinity(z))
        {
            return 1.0;
        }

        var absZ = Math.Abs(z);
        if (absZ >= 8.0)
        {
            return 0.0;
        }

        var p = 2.0 * (1.0 - Cdf(absZ));
        return Math.Clamp(p, 0.0, 1.0);
    }
}
