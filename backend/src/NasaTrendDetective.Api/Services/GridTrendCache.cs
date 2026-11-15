using System.Diagnostics;
using System.IO.Compression;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Api.Services;

/// <summary>
/// Cache of trend grids, stored as the final response body already serialized and Brotli-compressed.
///
/// Why bytes and not the DTO: a grid is up to 16,200 cells. Kept as objects it had to be serialized
/// (about 5 MB of JSON) and compressed again on every request, on a host with a fraction of a CPU.
/// Kept compressed it is about 1 MB in memory and goes out as it is.
///
/// Why no sliding expiration: a grid depends only on the dataset and the period, and datasets change
/// only when the process restarts (seeding runs at startup). The previous 5-minute sliding window
/// made the first visitor after any pause wait for the whole computation again (measured on the live
/// host: 20 to 36 seconds per variable).
///
/// Why one grid at a time: DuckDB runs with a small memory limit on the host. Measured in a 512 MB
/// container, two grids computed at once ran it out of memory and the request failed with a 500.
/// The gate also makes simultaneous requests for the same grid share a single computation.
/// </summary>
public sealed class GridTrendCache : IDisposable
{
    /// <summary>Browsers may reuse a grid for 5 minutes; shared caches for an hour, serving stale while they refresh.</summary>
    public const string CacheControl = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

    /// <summary>Cache units per grid (the cache is bounded in units, see Program.cs).</summary>
    public const int EntrySize = 8;

    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(12);

    private readonly IMemoryCache _cache;
    private readonly JsonSerializerOptions _json;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly ILogger<GridTrendCache>? _logger;

    public GridTrendCache(IMemoryCache cache, IOptions<JsonOptions> jsonOptions, ILogger<GridTrendCache>? logger = null)
    {
        ArgumentNullException.ThrowIfNull(jsonOptions);
        _logger = logger;
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        // The same options MVC uses, so a cached body is byte-for-byte what Ok(result) would send.
        _json = jsonOptions.Value.JsonSerializerOptions;
    }

    public bool TryGet(GridTrendQueryDto query, out byte[] brotli)
    {
        if (_cache.TryGetValue<byte[]>(Key(query), out var cached) && cached is not null)
        {
            brotli = cached;
            return true;
        }

        brotli = [];
        return false;
    }

    /// <summary>
    /// Body of the grid: from the cache, or computed now (one at a time) and stored. Null when
    /// <paramref name="compute"/> returns null, which means the variable has no dataset.
    /// <paramref name="pinned"/> marks the default period of a dataset (computed at warm-up): those are
    /// never evicted to make room for others.
    /// </summary>
    public async Task<byte[]?> GetOrComputeAsync(
        GridTrendQueryDto query,
        Func<CancellationToken, Task<GridTrendResultDto?>> compute,
        bool pinned,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(compute);

        if (TryGet(query, out var cached) && !pinned)
        {
            return cached;
        }

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            // Someone else may have computed it while this caller waited for the gate.
            if (TryGet(query, out cached))
            {
                return pinned ? Set(query, cached, pinned: true) : cached;
            }

            var watch = Stopwatch.StartNew();
            var body = await ComputeBodyAsync(compute, cancellationToken).ConfigureAwait(false);
            if (body is null)
            {
                return null;
            }

            // A grid leaves behind the annual series of every cell (hundreds of thousands of objects) and
            // about 5 MB of JSON. On a 512 MB host that garbage must go back to the system now, not when
            // the collector gets round to it: measured, memory kept climbing with every grid computed.
            GC.Collect(GC.MaxGeneration, GCCollectionMode.Aggressive, blocking: true, compacting: true);
            _logger?.LogInformation(
                "Trend grid computed: {Variable} {Start}-{End}, {Seconds:F1} s, {Bytes} bytes compressed; process {WorkingSetMb} MB, managed heap {ManagedMb} MB.",
                query.Variable, query.StartYear, query.EndYear, watch.Elapsed.TotalSeconds, body.Length,
                Environment.WorkingSet / 1048576, GC.GetTotalMemory(forceFullCollection: false) / 1048576);
            return Set(query, body, pinned);
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>Stores, as the default grid of a dataset, a body computed elsewhere (shipped with the image).</summary>
    public void Pin(GridTrendQueryDto query, byte[] brotli)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(brotli);
        Set(query, brotli, pinned: true);
    }

    public void Dispose() => _gate.Dispose();

    /// <summary>In its own method so the grid and its JSON are out of scope, and collectable, when it returns.</summary>
    private async Task<byte[]?> ComputeBodyAsync(
        Func<CancellationToken, Task<GridTrendResultDto?>> compute, CancellationToken cancellationToken)
    {
        var result = await compute(cancellationToken).ConfigureAwait(false);
        return result is null ? null : Compress(JsonSerializer.SerializeToUtf8Bytes(result, _json));
    }

    private byte[] Set(GridTrendQueryDto query, byte[] brotli, bool pinned)
    {
        _cache.Set(Key(query), brotli, new MemoryCacheEntryOptions
        {
            Size = EntrySize,
            AbsoluteExpirationRelativeToNow = Lifetime,
            Priority = pinned ? CacheItemPriority.NeverRemove : CacheItemPriority.Normal
        });
        return brotli;
    }

    public static byte[] Decompress(byte[] brotli)
    {
        using var input = new MemoryStream(brotli);
        using var stream = new BrotliStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        stream.CopyTo(output);
        return output.ToArray();
    }

    private static byte[] Compress(byte[] json)
    {
        using var output = new MemoryStream(json.Length / 4);
        // Paid once per grid, so it can afford a better ratio than the per-request "Fastest" level.
        using (var stream = new BrotliStream(output, CompressionLevel.Optimal, leaveOpen: true))
        {
            stream.Write(json);
        }

        return output.ToArray();
    }

    private static string Key(GridTrendQueryDto query) => $"grid_{query.Variable}_{query.StartYear}_{query.EndYear}";
}
