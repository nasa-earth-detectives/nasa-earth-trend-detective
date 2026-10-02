using NasaTrendDetective.Application.Statistics;

namespace NasaTrendDetective.Tests.Statistics;

public class SensSlopeEstimatorTests
{
    [Fact]
    public void Estimate_WithLinearSeries_ComputesExactSlope()
    {
        // Serie lineal: y = 2.5 * x + 10 para x = 0..4
        var values = new double[] { 10.0, 12.5, 15.0, 17.5, 20.0 };
        var years = new int[] { 2000, 2001, 2002, 2003, 2004 };

        var result = SensSlopeEstimator.Estimate(values, years, varianceS: 25.0);

        Assert.Equal(2.5, result.Slope);
        Assert.Equal(25.0, result.SlopePerDecade);
        Assert.True(result.ConfidenceInterval95.Lower <= result.Slope);
        Assert.True(result.ConfidenceInterval95.Upper >= result.Slope);
    }

    [Fact]
    public void Estimate_WithOutliers_RemainsRobustComparedToOLS()
    {
        // Serie con un outlier extremo al final
        var values = new double[] { 1.0, 2.0, 3.0, 4.0, 100.0 };

        var result = SensSlopeEstimator.Estimate(values);

        // La mediana no se desvía drásticamente por el 100.0
        Assert.True(result.Slope < 10.0, $"La pendiente de Sen {result.Slope} debe ser robusta frente al outlier");
        Assert.True(result.Slope >= 1.0);
    }

    [Fact]
    public void Estimate_WithSingleValue_ReturnsZero()
    {
        var values = new double[] { 42.0 };

        var result = SensSlopeEstimator.Estimate(values);

        Assert.Equal(0.0, result.Slope);
        Assert.Equal(0.0, result.SlopePerDecade);
    }
}
