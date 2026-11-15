using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Tests.ScientificValidation;

/// <summary>
/// The trend grid uses a lighter path than the single-cell analysis (no regression t-test, no
/// confidence interval, medians by selection instead of a full sort). It is only acceptable if it
/// returns exactly the same numbers for the fields the grid sends.
/// </summary>
public class GridFastPathTests
{
    [Fact]
    public void AnalyzeCell_ReturnsTheSameNumbersAsTheFullAnalysis()
    {
        var random = new Random(20261115);
        for (var cell = 0; cell < 600; cell++)
        {
            var slope = 0.05 * Gaussian(random);
            var carry = 0.0;
            var years = Enumerable.Range(1981, 10 + cell % 36).Where(year => cell % 5 != 0 || year is not (2001 or 2002));
            var series = years.Select(year =>
            {
                carry = 0.5 * carry + Gaussian(random);
                // Two decimals on purpose: real data is rounded and produces ties.
                var value = Math.Round(slope * (year - 1981) + carry, 2);
                return new AnnualObservation(year, value, cell % 3 == 0 ? null : value);
            }).ToList();
            if (cell % 4 == 0)
            {
                series.Reverse(); // the fast path must not rely on the repository order
            }

            var full = TrendStatisticsEngine.Analyze(series);
            var fast = TrendStatisticsEngine.AnalyzeCell(series);

            Assert.Equal(full.SensSlope, fast.SensSlope);
            Assert.Equal(full.SensSlopePerDecade, fast.SensSlopePerDecade);
            Assert.Equal(full.ZScore, fast.ZScore);
            Assert.Equal(full.PValue, fast.PValue);
            Assert.Equal(full.IsSignificant, fast.IsSignificant);
            Assert.Equal(full.Direction, fast.Direction);
            Assert.Equal(full.Prewhitened.PValue, fast.PrewhitenedPValue);
        }
    }

    [Fact]
    public void AnalyzeCell_WithOneOrNoYears_DoesNotThrow()
    {
        Assert.Equal(0.0, TrendStatisticsEngine.AnalyzeCell([]).SensSlope);
        Assert.False(TrendStatisticsEngine.AnalyzeCell([new AnnualObservation(2020, 1.5)]).IsSignificant);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(7)]
    [InlineData(990)]
    [InlineData(991)]
    public void Median_BySelection_MatchesMedianBySorting(int count)
    {
        var random = new Random(count);
        for (var round = 0; round < 50; round++)
        {
            // Few distinct values: repeated items are where a selection algorithm usually breaks.
            var values = Enumerable.Range(0, count).Select(_ => Math.Round(Gaussian(random), round % 3)).ToArray();
            var sorted = values.OrderBy(value => value).ToArray();
            var expected = count % 2 == 1 ? sorted[count / 2] : (sorted[count / 2 - 1] + sorted[count / 2]) / 2.0;

            Assert.Equal(expected, OrderStatistics.Median(values, count));
        }
    }

    [Fact]
    public void Median_OfNothing_IsZero() => Assert.Equal(0.0, OrderStatistics.Median([], 0));

    private static double Gaussian(Random random) =>
        Math.Sqrt(-2.0 * Math.Log(1.0 - random.NextDouble())) * Math.Cos(2.0 * Math.PI * random.NextDouble());
}
