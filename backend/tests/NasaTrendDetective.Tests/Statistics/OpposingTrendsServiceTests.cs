using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Statistics;

public class OpposingTrendsServiceTests
{
    private readonly OpposingTrendsService _service = new();

    [Fact]
    public async Task GetPredefinedPairsAsync_ReturnsThreeIconicNasaCases()
    {
        var pairs = await _service.GetPredefinedPairsAsync();

        Assert.NotNull(pairs);
        Assert.Equal(3, pairs.Count);
        Assert.Contains(pairs, p => p.PairId == "arctic-atlantic-thermal");
        Assert.Contains(pairs, p => p.PairId == "amazon-china-ndvi");
        Assert.Contains(pairs, p => p.PairId == "polar-ice-divergence");
    }

    [Fact]
    public async Task ArcticAtlanticPair_ShowsSignificantThermalDivergence()
    {
        var pair = await _service.GetPairByIdAsync("arctic-atlantic-thermal");

        Assert.NotNull(pair);
        Assert.True(pair.IncreasingRegion.Stats.SensSlope > 0, "Ártico debe tener pendiente positiva");
        Assert.True(pair.DecreasingRegion.Stats.SensSlope < 0, "Atlántico debe tener pendiente negativa");
        Assert.True(pair.DivergenceIndex > 0, "El índice de divergencia debe ser positivo");
    }

    [Fact]
    public void EvaluatePair_WithDynamicRegions_AssignsIncreasingAndDecreasingCorrectly()
    {
        var verdictHigh = new StatisticalVerdict(35, 60, 3.2, 0.001, 0.5, 5.0, new[] { 0.3, 0.7 }, TrendDirection.Increasing, TrendSignificance.SignificantlyIncreasing);
        var verdictLow = new StatisticalVerdict(-28, 60, -2.6, 0.009, -0.4, -4.0, new[] { -0.6, -0.2 }, TrendDirection.Decreasing, TrendSignificance.SignificantlyDecreasing);

        var regA = new RegionalTrendSummary("rA", "Región A", 10, 20, ClimateVariable.Gistemp, 2000, 2024, Array.Empty<AnnualObservation>(), verdictHigh);
        var regB = new RegionalTrendSummary("rB", "Región B", -10, -20, ClimateVariable.Gistemp, 2000, 2024, Array.Empty<AnnualObservation>(), verdictLow);

        var pair = _service.EvaluatePair(regA, regB, "Divergencia Térmica", "Notas científicas");

        Assert.Equal("rA", pair.IncreasingRegion.RegionId);
        Assert.Equal("rB", pair.DecreasingRegion.RegionId);
        Assert.True(pair.DivergenceIndex > 0);
    }
}
