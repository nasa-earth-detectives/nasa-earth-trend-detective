using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Statistics;

public class MannKendallCalculatorTests
{
    [Fact]
    public void Calculate_WithMonotonicIncreasingSeries_ReturnsPositiveZAndSignificant()
    {
        // 10 strictly increasing points
        var values = new double[] { 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 };

        var result = MannKendallCalculator.Calculate(values);

        // n=10 => S = 10*9/2 = 45
        Assert.Equal(45.0, result.S);
        Assert.True(result.ZScore > 1.96, $"ZScore {result.ZScore} should be > 1.96");
        Assert.True(result.PValue < 0.05, $"PValue {result.PValue} should be < 0.05");
        Assert.Equal(TrendDirection.Increasing, result.Direction);
        Assert.Equal(TrendSignificance.SignificantlyIncreasing, result.Significance);
    }

    [Fact]
    public void Calculate_WithMonotonicDecreasingSeries_ReturnsNegativeZAndSignificant()
    {
        // 10 strictly decreasing points
        var values = new double[] { 10.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0 };

        var result = MannKendallCalculator.Calculate(values);

        Assert.Equal(-45.0, result.S);
        Assert.True(result.ZScore < -1.96, $"ZScore {result.ZScore} should be < -1.96");
        Assert.True(result.PValue < 0.05, $"PValue {result.PValue} should be < 0.05");
        Assert.Equal(TrendDirection.Decreasing, result.Direction);
        Assert.Equal(TrendSignificance.SignificantlyDecreasing, result.Significance);
    }

    [Fact]
    public void Calculate_WithConstantValues_ReturnsZeroSAndNonSignificant()
    {
        var values = new double[] { 5.0, 5.0, 5.0, 5.0, 5.0, 5.0 };

        var result = MannKendallCalculator.Calculate(values);

        Assert.Equal(0.0, result.S);
        Assert.Equal(0.0, result.ZScore);
        Assert.Equal(1.0, result.PValue);
        Assert.Equal(TrendDirection.Stable, result.Direction);
        Assert.Equal(TrendSignificance.NonSignificant, result.Significance);
    }

    [Fact]
    public void Calculate_WithTies_CorrectsVarianceAccurately()
    {
        // Series with ties: two groups of size 2 and one of size 3
        var values = new double[] { 1.0, 2.0, 2.0, 3.0, 3.0, 3.0, 4.0, 4.0, 5.0 };

        var result = MannKendallCalculator.Calculate(values);

        // Without ties, n=9 varS = 9*8*23 / 18 = 92.
        // With ties, variance must be less than 92.
        Assert.True(result.VarianceS < 92.0, $"Corrected variance {result.VarianceS} must be less than variance without ties");
        Assert.True(result.VarianceS > 0.0);
        Assert.True(result.S > 0);
    }

    [Fact]
    public void Calculate_WithLessThanThreeObservations_ReturnsSafeDefaults()
    {
        var values = new double[] { 1.0, 2.0 };

        var result = MannKendallCalculator.Calculate(values);

        Assert.Equal(0.0, result.S);
        Assert.Equal(0.0, result.ZScore);
        Assert.Equal(TrendDirection.Stable, result.Direction);
        Assert.Equal(TrendSignificance.NonSignificant, result.Significance);
    }
}
