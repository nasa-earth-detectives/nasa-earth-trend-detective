using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Siembra los datasets en segundo plano al arrancar. No bloquea el arranque: mientras carga, la API
/// responde y declara la variable como "synthetic"; al terminar pasa a "observed". Un fallo se
/// registra en el log y no tumba el proceso.
/// </summary>
/// <remarks>
/// Depende de que <see cref="DuckDbSchemaHostedService"/> haya creado el esquema: el host arranca los
/// servicios en orden de registro y AddInfrastructure registra DuckDB antes que el sembrado. No se
/// reinicializa aquí: dos inicializaciones concurrentes sobre el mismo archivo chocan en DuckDB
/// ("Catalog write-write conflict").
/// </remarks>
public sealed class DatasetSeedHostedService : BackgroundService
{
    private readonly IDatasetSeeder _seeder;
    private readonly DatasetSeedOptions _options;
    private readonly ILogger<DatasetSeedHostedService> _logger;

    public DatasetSeedHostedService(
        IDatasetSeeder seeder,
        IOptions<DatasetSeedOptions> options,
        ILogger<DatasetSeedHostedService> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _seeder = seeder ?? throw new ArgumentNullException(nameof(seeder));
        _options = options.Value;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
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
            _logger.LogError(ex, "Falló el sembrado de datasets; la API seguirá con datos sintéticos.");
        }
    }
}
