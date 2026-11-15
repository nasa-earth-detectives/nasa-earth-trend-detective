using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Api.Services;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Api;

/// <summary>
/// The grid cache keeps the response body already compressed and lets only one grid be computed at a
/// time (two at once ran DuckDB out of memory in a 512 MB container). And the catalog must never call a
/// variable "synthetic": it is observed, still loading, or unavailable.
/// </summary>
public class GridTrendCacheTests
{
    private static readonly GridTrendQueryDto Query = new() { Variable = ClimateVariable.Merra2Temperature, StartYear = 1981, EndYear = 2025 };

    [Fact]
    public async Task CachedBody_IsTheSameJsonTheApiWouldSend()
    {
        using var cache = NewCache(out var json);
        var grid = Grid(cells: 300);

        var body = await cache.GetOrComputeAsync(Query, _ => Task.FromResult<GridTrendResultDto?>(grid), pinned: false, default);

        Assert.NotNull(body);
        var expected = JsonSerializer.SerializeToUtf8Bytes(grid, json);
        Assert.Equal(expected, GridTrendCache.Decompress(body));
        Assert.True(body.Length < expected.Length / 3, "the stored body should be much smaller than the JSON");
    }

    [Fact]
    public async Task SimultaneousRequests_ShareOneComputation()
    {
        using var cache = NewCache(out _);
        var computations = 0;
        async Task<GridTrendResultDto?> Compute(CancellationToken token)
        {
            Interlocked.Increment(ref computations);
            await Task.Delay(150, token);
            return Grid(cells: 10);
        }

        var bodies = await Task.WhenAll(Enumerable.Range(0, 8)
            .Select(_ => cache.GetOrComputeAsync(Query, Compute, pinned: false, default)));

        Assert.Equal(1, computations);
        Assert.All(bodies, body => Assert.Same(bodies[0], body));
    }

    [Fact]
    public async Task DifferentGrids_AreNeverComputedAtTheSameTime()
    {
        using var cache = NewCache(out _);
        var running = 0;
        var overlapped = false;
        async Task<GridTrendResultDto?> Compute(CancellationToken token)
        {
            overlapped |= Interlocked.Increment(ref running) > 1;
            await Task.Delay(60, token);
            Interlocked.Decrement(ref running);
            return Grid(cells: 5);
        }

        await Task.WhenAll(Enumerable.Range(0, 5).Select(index => cache.GetOrComputeAsync(
            new GridTrendQueryDto { Variable = ClimateVariable.Gistemp, StartYear = 2000 + index, EndYear = 2025 },
            Compute, pinned: false, default)));

        Assert.False(overlapped);
    }

    [Fact]
    public async Task VariableWithoutDataset_IsNotCached()
    {
        using var cache = NewCache(out _);

        var body = await cache.GetOrComputeAsync(Query, _ => Task.FromResult<GridTrendResultDto?>(null), pinned: true, default);

        Assert.Null(body);
        Assert.False(cache.TryGet(Query, out _));
    }

    [Theory]
    [InlineData(false, "loading")]
    [InlineData(true, "unavailable")]
    public async Task Catalog_WithoutDataset_SaysLoadingUntilSeedingEndsAndThenUnavailable(bool seedingDone, string expected)
    {
        var service = new DatasetCatalogService(new EmptyCatalog(), new SeedState(seedingDone));

        var catalog = await service.GetCatalogAsync();

        Assert.Equal(Enum.GetValues<ClimateVariable>().Length, catalog.Count);
        Assert.All(catalog, entry =>
        {
            Assert.Equal(expected, entry.Status);
            Assert.Null(entry.Provenance);
        });
    }

    private static GridTrendCache NewCache(out JsonSerializerOptions json)
    {
        var options = new JsonOptions();
        json = options.JsonSerializerOptions;
        return new GridTrendCache(new MemoryCache(new MemoryCacheOptions { SizeLimit = 160 }), Options.Create(options));
    }

    private static GridTrendResultDto Grid(int cells) => new()
    {
        Variable = ClimateVariable.Merra2Temperature, StartYear = 1981, EndYear = 2025, Unit = "°C / year",
        ResolutionDegrees = 2, Provider = "test", Product = "test", MinMonthsPerYear = 1, MinYearsPerCell = 10,
        Cells = Enumerable.Range(0, cells).Select(index => new GridTrendCellDto
        {
            Latitude = -89 + 2 * (index % 90), Longitude = -179 + 2 * (index % 180), SensSlope = 0.001 * index,
            SensSlopePerDecade = 0.01 * index, MannKendallZ = 2.5, PValue = 0.012, IsSignificant = true,
            PrewhitenedPValue = 0.03, AdjustedPValue = 0.04, IsSignificantCorrected = true, Direction = "Increasing", Years = 45
        }).ToList()
    };

    private sealed class EmptyCatalog : IDatasetCatalogRepository
    {
        public Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<DatasetProvenance>>([]);

        public Task<DatasetProvenance?> GetAsync(ClimateVariable variable, CancellationToken cancellationToken = default) =>
            Task.FromResult<DatasetProvenance?>(null);
    }

    private sealed class SeedState(bool completed) : IDatasetSeedState
    {
        public bool IsCompleted => completed;
        public Task Completed => completed ? Task.CompletedTask : new TaskCompletionSource().Task;
    }
}
