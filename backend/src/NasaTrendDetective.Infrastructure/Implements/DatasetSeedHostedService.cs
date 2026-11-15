using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Seeds datasets in the background upon application startup. Does not block startup: while loading, the API
/// declares the pending variables as "loading" and returns no data for them; once finished, they
/// transition to "observed". Failures are logged without terminating the process.
/// </summary>
/// <remarks>
/// Depends on <see cref="DuckDbSchemaHostedService"/> having created the schema: the host starts
/// services in registration order and AddInfrastructure registers DuckDB prior to seeding.
/// Initialization is not repeated here: concurrent schema initializations against the same database file
/// cause DuckDB conflicts ("Catalog write-write conflict").
/// </remarks>
public sealed class DatasetSeedHostedService : BackgroundService
{
    private readonly IDatasetSeeder _seeder;
    private readonly DatasetSeedState _state;
    private readonly DatasetSeedOptions _options;
    private readonly ILogger<DatasetSeedHostedService> _logger;

    public DatasetSeedHostedService(
        IDatasetSeeder seeder,
        DatasetSeedState state,
        IOptions<DatasetSeedOptions> options,
        ILogger<DatasetSeedHostedService> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _seeder = seeder ?? throw new ArgumentNullException(nameof(seeder));
        _state = state ?? throw new ArgumentNullException(nameof(state));
        _options = options.Value;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _state.MarkCompleted();
            return;
        }

        await Task.Yield();
        try
        {
            await _seeder.SeedAsync(null, stoppingToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dataset seeding failed; the variables without a dataset stay unavailable.");
        }
        finally
        {
            // Whatever happened, nothing else is going to load: waiters (catalog status, grid warm-up) move on.
            _state.MarkCompleted();
        }
    }
}
