using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Statistics;

/// <summary>
/// The service no longer fabricates series: each pair comes from what the repository returns. Tests use
/// a mock repository to pin down the three rules: computed from the received series, without data
/// there is no pair, and a pair whose slopes move in the same direction is not presented as opposing.
/// </summary>
public class OpposingTrendsServiceTests
{
    private static readonly OpposingPairDefinition Precipitation =
        OpposingPairCatalog.Pairs.Single(pair => pair.Id == "precipitation");

    [Fact]
    public async Task GetPredefinedPairsAsync_BuildsEachPairFromTheStoredSeries()
    {
        // Rises in the first region of each pair and falls in the second.
        var service = new OpposingTrendsService(new FakeRepository((latitude, longitude) =>
            OpposingPairCatalog.Pairs.Any(p => p.First.Latitude == latitude && p.First.Longitude == longitude) ? 0.5 : -0.3),
            new FakeCatalog(loaded: true));

        var pairs = await service.GetPredefinedPairsAsync();

        Assert.Equal(OpposingPairCatalog.Pairs.Select(p => p.Id), pairs.Select(p => p.PairId));
        Assert.All(pairs, pair =>
        {
            Assert.Equal(0.5, pair.IncreasingRegion.Stats.SensSlope, precision: 6);
            Assert.Equal(-0.3, pair.DecreasingRegion.Stats.SensSlope, precision: 6);
            Assert.Equal(1981, pair.IncreasingRegion.StartYear);
            Assert.Equal(2025, pair.IncreasingRegion.EndYear);
            Assert.Equal(45, pair.IncreasingRegion.Observations.Count);
            Assert.True(pair.DivergenceIndex > 0);
        });
    }

    [Fact]
    public async Task GetPredefinedPairsAsync_WithoutLoadedDatasets_ReturnsNothingInsteadOfInventedPairs()
    {
        var service = new OpposingTrendsService(new FakeRepository((_, _) => 1.0), new FakeCatalog(loaded: false));

        Assert.Empty(await service.GetPredefinedPairsAsync());
    }

    [Fact]
    public async Task GetPairByIdAsync_WhenBothRegionsMoveTheSameWay_IsNotReportedAsOpposing()
    {
        var service = new OpposingTrendsService(new FakeRepository((_, _) => 0.4), new FakeCatalog(loaded: true));

        Assert.Null(await service.GetPairByIdAsync(Precipitation.Id));
    }

    [Fact]
    public async Task GetPairByIdAsync_WithTooFewYears_IsOmitted()
    {
        var service = new OpposingTrendsService(
            new FakeRepository((latitude, _) => latitude > 10 ? 0.5 : -0.5, years: 6), new FakeCatalog(loaded: true));

        Assert.Null(await service.GetPairByIdAsync(Precipitation.Id));
    }

    [Fact]
    public async Task GetPairByIdAsync_UnknownId_ReturnsNull()
    {
        var service = new OpposingTrendsService(new FakeRepository((_, _) => 1.0), new FakeCatalog(loaded: true));

        Assert.Null(await service.GetPairByIdAsync("arctic-atlantic-thermal"));
    }

    [Fact]
    public void EvaluatePair_WithDynamicRegions_AssignsIncreasingAndDecreasingCorrectly()
    {
        var service = new OpposingTrendsService(new FakeRepository((_, _) => 0), new FakeCatalog(loaded: false));
        var verdictHigh = new StatisticalVerdict(35, 60, 3.2, 0.001, 0.5, 5.0, [0.3, 0.7], TrendDirection.Increasing, TrendSignificance.SignificantlyIncreasing);
        var verdictLow = new StatisticalVerdict(-28, 60, -2.6, 0.009, -0.4, -4.0, [-0.6, -0.2], TrendDirection.Decreasing, TrendSignificance.SignificantlyDecreasing);
        var regA = new RegionalTrendSummary("rA", "Region A", 10, 20, ClimateVariable.Gistemp, 2000, 2024, [], verdictHigh);
        var regB = new RegionalTrendSummary("rB", "Region B", -10, -20, ClimateVariable.Gistemp, 2000, 2024, [], verdictLow);

        var pair = service.EvaluatePair(regB, regA, "Thermal divergence", "Notes");

        Assert.Equal("rA", pair.IncreasingRegion.RegionId);
        Assert.Equal("rB", pair.DecreasingRegion.RegionId);
        Assert.True(pair.DivergenceIndex > 0);
    }

    /// <summary>Exactly linear series from 1981 onward, with the slope decided per cell.</summary>
    private sealed class FakeRepository(Func<double, double, double> slopeAt, int years = 45) : ITrendObservationRepository
    {
        public Task<IReadOnlyList<AnnualObservation>> GetAnnualSeriesAsync(
            ClimateVariable variable, int startYear, int endYear, double? latitude = null, double? longitude = null,
            double toleranceDegrees = 1.0, double? longitudeToleranceDegrees = null,
            CancellationToken cancellationToken = default)
        {
            var slope = slopeAt(latitude ?? 0, longitude ?? 0);
            IReadOnlyList<AnnualObservation> series = Enumerable.Range(startYear, years)
                .Select(year => new AnnualObservation(year, slope * (year - startYear), slope * (year - startYear)))
                .ToList();
            return Task.FromResult(series);
        }

        public Task<IReadOnlyList<TrendObservation>> GetObservationsByYearAsync(
            ClimateVariable variable, int year, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<TrendObservation>>([]);
    }

    private sealed class FakeCatalog(bool loaded) : IDatasetCatalogRepository
    {
        public Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<DatasetProvenance>>([]);

        public Task<DatasetProvenance?> GetAsync(ClimateVariable variable, CancellationToken cancellationToken = default) =>
            Task.FromResult(loaded
                ? new DatasetProvenance(variable, "nasa-power-merra2", "Test MERRA-2", "mm/day", "mm/day / year",
                    "1991-2020", 2.0, "https://example.test/source", "source", "sha", DateTimeOffset.UnixEpoch, 1981, 2025,
                    "2025-12", false, "citation", 45, DateTimeOffset.UnixEpoch)
                : null);
    }
}
