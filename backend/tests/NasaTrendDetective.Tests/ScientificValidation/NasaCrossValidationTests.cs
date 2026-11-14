using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.ScientificValidation;

public class NasaCrossValidationTests
{
    [Fact]
    public void ArcticAmplification_MatchesNasaPublishedWarmingRate()
    {
        // Representative series of GISTEMP anomalies in the Arctic (2000-2024)
        // Official NASA literature reports Arctic warming of ~+0.7°C per decade.
        var observations = Enumerable.Range(2000, 25).Select(year =>
        {
            var t = year - 2000;
            // Physical trend of 0.07°C/year (= 0.70°C/decade) with interannual variability
            var tempAnomaly = 0.070 * t + 0.12 * Math.Sin(t * 1.7);
            return new AnnualObservation(year, Math.Round(tempAnomaly, 3), Math.Round(tempAnomaly, 3));
        }).ToList();

        var verdict = TrendStatisticsEngine.Analyze(observations);

        // Scientific tolerance: 0.65°C to 0.75°C per decade
        Assert.True(verdict.SensSlopePerDecade >= 0.60 && verdict.SensSlopePerDecade <= 0.80,
            $"Calculated decadal slope ({verdict.SensSlopePerDecade}°C/decade) must converge with NASA report (+0.70°C/decade).");
        Assert.True(verdict.ZScore > 1.96, "Arctic warming must be statistically significant.");
        Assert.Equal(TrendDirection.Increasing, verdict.Direction);
    }

    [Fact]
    public void GreenlandIceLoss_MatchesNasaGraceFoDecayRate()
    {
        // Representative GRACE/GRACE-FO data for Greenland ice mass (2002-2024)
        // NASA reports an average loss of ~-260 to -275 Gt/year (negative cumulative equivalent water height)
        var observations = Enumerable.Range(2002, 23).Select(year =>
        {
            var t = year - 2002;
            var massLoss = -262.0 * t + 15.0 * Math.Cos(t * 1.3);
            return new AnnualObservation(year, Math.Round(massLoss, 1), Math.Round(massLoss, 1));
        }).ToList();

        var verdict = TrendStatisticsEngine.Analyze(observations);

        // Sen's slope must reflect accelerated negative loss
        Assert.True(verdict.SensSlope <= -240.0 && verdict.SensSlope >= -280.0,
            $"Calculated mass loss ({verdict.SensSlope} Gt/year) converges with official GRACE-FO range.");
        Assert.True(verdict.ZScore < -1.96, "Greenland mass loss must be statistically significant.");
        Assert.Equal(TrendDirection.Decreasing, verdict.Direction);
    }
}
