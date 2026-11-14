using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.ScientificValidation;

/// <summary>
/// Validación cruzada contra una implementación independiente. Los valores esperados salen de
/// SciPy 1.18.1 (`stats.theilslopes(y, x, 0.95)` y `stats.linregress(x, y)`), calculados el 2026-11-14
/// con `referencia_scipy.py`. La tercera serie es real: anomalía anual de precipitación de MERRA-2
/// (NASA POWER) en la celda 5° S, 61° O, 1981-2025.
/// </summary>
public class SciPyCrossValidationTests
{
    private static readonly double[] ShortSeries = [1.2, 0.8, 1.9, 2.4, 1.7, 3.1, 2.6, 3.9, 3.3, 4.8, 4.1, 5.5];
    private static readonly double[] FlatSeries = [2.0, 3.1, 1.4, 2.8, 2.2, 3.4, 1.9, 2.5, 3.0, 1.6, 2.7, 2.3];

    private static readonly double[] AmazonPrecipitation =
    [
        0.777, 1.134, -0.161, 0.534, 0.366, 1.17, 0.784, -0.154, 0.334, -0.556, -0.82, -0.581, 2.047, 0.935, 0.254,
        1.205, -0.372, 0.002, 0.399, 0.318, 0.417, 0.473, -0.319, -0.229, -0.919, 0.506, -0.342, 0.881, 0.901, 0.121,
        -0.064, -0.209, 0.249, -0.159, -1.817, -0.382, -0.346, -1.59, -0.963, 0.405, 2.042, 1.572, -0.533, -1.192, -0.858,
    ];

    public static TheoryData<string, double, double, double> SenReferences => new()
    {
        { "short", 0.395455, 0.29, 0.45 },
        { "flat", 0.0, -0.15, 0.125 },
        { "amazon", -0.025477, -0.043182, -0.004688 },
    };

    public static TheoryData<string, double, double, double, double, double, double> LinearReferences => new()
    {
        { "short", 0.377273, 0.043575, 8.6579, 5.854691198e-06, 0.280181, 0.474365 },
        { "flat", 0.005245, 0.054228, 0.0967, 0.924862846, -0.115584, 0.126073 },
        { "amazon", -0.019973, 0.009408, -2.1230, 0.03955010519, -0.038945, -0.001 },
    };

    [Theory]
    [MemberData(nameof(SenReferences))]
    public void SensSlopeAndItsConfidenceInterval_MatchSciPy(string series, double slope, double lower, double upper)
    {
        var verdict = TrendStatisticsEngine.Analyze(Observations(series));

        Assert.Equal(slope, verdict.SensSlope, precision: 6);
        Assert.Equal(lower, verdict.ConfidenceInterval95[0], precision: 6);
        Assert.Equal(upper, verdict.ConfidenceInterval95[1], precision: 6);
    }

    [Theory]
    [MemberData(nameof(LinearReferences))]
    public void LinearRegressionTTest_MatchesSciPy(
        string series, double slope, double standardError, double t, double pValue, double lower, double upper)
    {
        var linear = TrendStatisticsEngine.Analyze(Observations(series)).Linear;

        Assert.Equal(slope, linear.Slope, precision: 6);
        Assert.Equal(standardError, linear.StandardError, precision: 6);
        Assert.Equal(t, linear.TStatistic, precision: 4);
        // Tolerancia relativa: los valores p abarcan seis órdenes de magnitud.
        Assert.InRange(linear.PValue, pValue * (1 - 1e-6), pValue * (1 + 1e-6));
        Assert.Equal(lower, linear.ConfidenceInterval95[0], precision: 6);
        Assert.Equal(upper, linear.ConfidenceInterval95[1], precision: 6);
        Assert.Equal(pValue < 0.05, linear.IsSignificant);
    }

    [Theory]
    [InlineData(10, 2.228139)]
    [InlineData(43, 2.016692)]
    public void StudentCriticalValueAt95Percent_MatchesSciPy(int degreesOfFreedom, double expected)
    {
        Assert.Equal(expected, StudentTDistribution.TwoTailedCriticalValue(0.05, degreesOfFreedom), precision: 6);
    }

    [Fact]
    public void RealSeries_BothMethodsAgreeOnASignificantDecline()
    {
        var verdict = TrendStatisticsEngine.Analyze(Observations("amazon"));

        Assert.Equal(TrendDirection.Decreasing, verdict.Direction);
        Assert.True(verdict.IsSignificant);
        Assert.True(verdict.Linear.IsSignificant);
        // Los dos intervalos del 95 % quedan enteros por debajo de cero.
        Assert.True(verdict.ConfidenceInterval95[1] < 0);
        Assert.True(verdict.Linear.ConfidenceInterval95[1] < 0);
    }

    [Fact]
    public void KnownSlopeWithYearToYearNoise_IsRecovered()
    {
        // Serie construida: 0,07 por año más una oscilación. No es un dato de la NASA; sólo comprueba
        // que el motor recupera una pendiente conocida.
        var observations = Enumerable.Range(2000, 25)
            .Select(year => new AnnualObservation(year, 0.070 * (year - 2000) + 0.12 * Math.Sin((year - 2000) * 1.7)))
            .ToList();

        var verdict = TrendStatisticsEngine.Analyze(observations);

        Assert.InRange(verdict.SensSlopePerDecade, 0.60, 0.80);
        Assert.InRange(verdict.Linear.Slope, 0.060, 0.080);
        Assert.Equal(TrendDirection.Increasing, verdict.Direction);
    }

    [Fact]
    public void TooShortASeries_IsInconclusiveInsteadOfThrowing()
    {
        var linear = LinearTrendTest.Calculate([1.0, 2.0], [2000, 2001]);

        Assert.False(linear.IsSignificant);
        Assert.Equal(1.0, linear.PValue);
    }

    private static List<AnnualObservation> Observations(string series)
    {
        var (values, firstYear) = series switch
        {
            "short" => (ShortSeries, 2010),
            "flat" => (FlatSeries, 2010),
            _ => (AmazonPrecipitation, 1981),
        };
        return values.Select((value, index) => new AnnualObservation(firstYear + index, value, value)).ToList();
    }
}
