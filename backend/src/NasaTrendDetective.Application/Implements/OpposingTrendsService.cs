using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// Pairs of regions where the same variable moves in opposite directions: the central idea of the challenge. Each
/// pair is computed from the real series of its two cells. Without a loaded dataset, without enough years, or if
/// both slopes have the same sign, the pair is not returned: nothing is fabricated here.
/// </summary>
public class OpposingTrendsService : IOpposingTrendsService
{
    private readonly ITrendObservationRepository _repository;
    private readonly IDatasetCatalogRepository _catalog;

    public OpposingTrendsService(ITrendObservationRepository repository, IDatasetCatalogRepository catalog)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
    }

    public async Task<IReadOnlyList<OpposingTrendPair>> GetPredefinedPairsAsync(CancellationToken cancellationToken = default)
    {
        var pairs = new List<OpposingTrendPair>();
        foreach (var definition in OpposingPairCatalog.Pairs)
        {
            var pair = await BuildAsync(definition, cancellationToken).ConfigureAwait(false);
            if (pair is not null)
            {
                pairs.Add(pair);
            }
        }

        return pairs;
    }

    public async Task<OpposingTrendPair?> GetPairByIdAsync(string pairId, CancellationToken cancellationToken = default)
    {
        var definition = OpposingPairCatalog.Pairs
            .FirstOrDefault(p => string.Equals(p.Id, pairId, StringComparison.OrdinalIgnoreCase));
        return definition is null ? null : await BuildAsync(definition, cancellationToken).ConfigureAwait(false);
    }

    public OpposingTrendPair EvaluatePair(
        RegionalTrendSummary regionA,
        RegionalTrendSummary regionB,
        string driverProcess,
        string notes)
    {
        ArgumentNullException.ThrowIfNull(regionA);
        ArgumentNullException.ThrowIfNull(regionB);

        var (increasing, decreasing) = regionA.Stats.SensSlope >= regionB.Stats.SensSlope
            ? (regionA, regionB)
            : (regionB, regionA);

        var divergenceIndex = Math.Round(
            Math.Abs(increasing.Stats.ZScore - decreasing.Stats.ZScore) *
            (1.0 + Math.Abs(increasing.Stats.SensSlope - decreasing.Stats.SensSlope)),
            3);

        return new OpposingTrendPair(
            $"dynamic-{regionA.RegionId}-{regionB.RegionId}",
            driverProcess,
            increasing,
            decreasing,
            divergenceIndex,
            notes);
    }

    private async Task<OpposingTrendPair?> BuildAsync(OpposingPairDefinition definition, CancellationToken ct)
    {
        var provenance = await _catalog.GetAsync(definition.Variable, ct).ConfigureAwait(false);
        if (provenance is null)
        {
            return null;
        }

        var first = await SummarizeAsync(definition, definition.First, provenance, ct).ConfigureAwait(false);
        var second = await SummarizeAsync(definition, definition.Second, provenance, ct).ConfigureAwait(false);
        // "Opposing" is determined by today's data, not the pair definition.
        if (first is null || second is null || Math.Sign(first.Stats.SensSlope) * Math.Sign(second.Stats.SensSlope) >= 0)
        {
            return null;
        }

        var notes = $"Computed from {provenance.Product}, {provenance.CoverageStart}-{provenance.CoverageEnd}: "
            + "Mann-Kendall test and Sen's slope over the observed annual series of each "
            + $"{provenance.ResolutionDegrees:0.#}° cell. Describes what the data show; does not assert causality.";
        return EvaluatePair(first, second, definition.Title, notes) with { PairId = definition.Id };
    }

    private async Task<RegionalTrendSummary?> SummarizeAsync(
        OpposingPairDefinition definition, OpposingRegion region, DatasetProvenance provenance, CancellationToken ct)
    {
        var series = await _repository.GetAnnualSeriesAsync(
            definition.Variable, provenance.CoverageStart, provenance.CoverageEnd,
            region.Latitude, region.Longitude, toleranceDegrees: 1.0, ct).ConfigureAwait(false);
        if (series.Count < GridTrendService.MinYearsPerCell)
        {
            return null;
        }

        return new RegionalTrendSummary(
            region.Id, region.Name, region.Latitude, region.Longitude, definition.Variable,
            series[0].Year, series[^1].Year, series, TrendStatisticsEngine.Analyze(series));
    }
}
