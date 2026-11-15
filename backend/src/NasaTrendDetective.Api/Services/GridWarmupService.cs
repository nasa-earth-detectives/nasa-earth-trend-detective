using System.Diagnostics;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Api.Services;

/// <summary>
/// Makes the trend grid of every loaded dataset over its whole coverage (the period the frontend asks
/// for by default) available without anyone waiting for it. Without it the first person to open the
/// trend map of each variable pays for the computation (20 to 36 seconds on the live host).
///
/// Grids shipped with the image (see <see cref="GridFileStore"/>) are simply read. A grid with no file
/// is computed here, in the background, one variable at a time through the same gate as the requests
/// (see <see cref="GridTrendCache"/>).
///
/// With GridCache:ExportAndExit the service writes every grid to the store and stops the process: that
/// is how the image build produces the files. Any failure there ends with exit code 1, so the build
/// stops instead of shipping an image with grids missing.
/// </summary>
public sealed class GridWarmupService : BackgroundService
{
    /// <summary>A build that hangs is worse than one that fails: the export gives up after this long.</summary>
    private static readonly TimeSpan ExportTimeout = TimeSpan.FromMinutes(15);

    private readonly IServiceScopeFactory _scopes;
    private readonly IDatasetSeedState _seedState;
    private readonly GridTrendCache _cache;
    private readonly GridFileStore _store;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<GridWarmupService> _logger;
    private readonly bool _exportAndExit;

    public GridWarmupService(
        IServiceScopeFactory scopes,
        IDatasetSeedState seedState,
        GridTrendCache cache,
        GridFileStore store,
        IHostApplicationLifetime lifetime,
        IConfiguration configuration,
        ILogger<GridWarmupService> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        _seedState = seedState ?? throw new ArgumentNullException(nameof(seedState));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _lifetime = lifetime ?? throw new ArgumentNullException(nameof(lifetime));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _exportAndExit = configuration.GetValue("GridCache:ExportAndExit", false);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_exportAndExit)
        {
            await WarmAsync(stoppingToken).ConfigureAwait(false);
            return;
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        timeout.CancelAfter(ExportTimeout);
        var complete = false;
        try
        {
            complete = _store.Enabled && await WarmAsync(timeout.Token).ConfigureAwait(false);
        }
        finally
        {
            if (!complete)
            {
                _logger.LogError("Trend grid export did not complete.");
                Environment.ExitCode = 1;
            }

            _lifetime.StopApplication();
        }
    }

    /// <summary>True when every loaded dataset ended up with its default grid available.</summary>
    private async Task<bool> WarmAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _seedState.Completed.WaitAsync(cancellationToken).ConfigureAwait(false);

            using var scope = _scopes.CreateScope();
            var catalog = scope.ServiceProvider.GetRequiredService<IDatasetCatalogRepository>();
            var grids = scope.ServiceProvider.GetRequiredService<IGridTrendService>();

            var datasets = await catalog.GetAllAsync(cancellationToken).ConfigureAwait(false);
            var available = 0;
            foreach (var provenance in datasets.OrderBy(dataset => (int)dataset.Variable))
            {
                if (await WarmOneAsync(provenance, grids, cancellationToken).ConfigureAwait(false))
                {
                    available++;
                }
            }

            return datasets.Count > 0 && available == datasets.Count;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Trend grid warm-up stopped.");
            return false;
        }
    }

    private async Task<bool> WarmOneAsync(DatasetProvenance provenance, IGridTrendService grids, CancellationToken cancellationToken)
    {
        var query = new GridTrendQueryDto
        {
            Variable = provenance.Variable,
            StartYear = provenance.CoverageStart,
            EndYear = provenance.CoverageEnd
        };

        var shipped = _store.TryRead(provenance);
        if (shipped is not null)
        {
            _cache.Pin(query, shipped);
            _logger.LogInformation(
                "Trend grid loaded from the image: {Variable} {Start}-{End}, {Bytes} bytes compressed.",
                query.Variable, query.StartYear, query.EndYear, shipped.Length);
            return true;
        }

        var watch = Stopwatch.StartNew();
        try
        {
            var body = await _cache.GetOrComputeAsync(
                query, token => grids.AnalyzeGridAsync(query, token), pinned: true, cancellationToken)
                .ConfigureAwait(false);
            if (body is null)
            {
                return false;
            }

            if (_exportAndExit)
            {
                _store.Write(provenance, body);
            }

            _logger.LogInformation(
                "Trend grid warmed: {Variable} {Start}-{End}, {Seconds:F1} s, {Bytes} bytes compressed.",
                query.Variable, query.StartYear, query.EndYear, watch.Elapsed.TotalSeconds, body.Length);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A grid that fails here is simply computed on demand, as before.
            _logger.LogWarning(ex, "Trend grid warm-up failed for {Variable}.", query.Variable);
            return false;
        }
    }
}
