using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Statistics;

public class MannKendallCalculatorTests
{
    [Fact]
    public void Calculate_WithMonotonicIncreasingSeries_ReturnsPositiveZAndSignificant()
    {
        // 10 puntos estrictamente crecientes
        var values = new double[] { 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 };

        var result = MannKendallCalculator.Calculate(values);

        // n=10 => S = 10*9/2 = 45
        Assert.Equal(45.0, result.S);
        Assert.True(result.ZScore > 1.96, $"ZScore {result.ZScore} debería ser > 1.96");
        Assert.True(result.PValue < 0.05, $"PValue {result.PValue} debería ser < 0.05");
        Assert.Equal(TrendDirection.Increasing, result.Direction);
        Assert.Equal(TrendSignificance.SignificantlyIncreasing, result.Significance);
    }

    [Fact]
    public void Calculate_WithMonotonicDecreasingSeries_ReturnsNegativeZAndSignificant()
    {
        // 10 puntos estrictamente decrecientes
        var values = new double[] { 10.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0 };

        var result = MannKendallCalculator.Calculate(values);

        Assert.Equal(-45.0, result.S);
        Assert.True(result.ZScore < -1.96, $"ZScore {result.ZScore} debería ser < -1.96");
        Assert.True(result.PValue < 0.05, $"PValue {result.PValue} debería ser < 0.05");
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
        // Serie con empates: dos grupos de tamaño 2 y uno de tamaño 3
        var values = new double[] { 1.0, 2.0, 2.0, 3.0, 3.0, 3.0, 4.0, 4.0, 5.0 };

        var result = MannKendallCalculator.Calculate(values);

        // Sin empates, n=9 varS = 9*8*23 / 18 = 92.
        // Con empates, la varianza debe ser menor a 92.
        Assert.True(result.VarianceS < 92.0, $"Varianza corregida {result.VarianceS} debe ser menor a la varianza sin empates");
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
