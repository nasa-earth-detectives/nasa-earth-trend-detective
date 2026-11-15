using Microsoft.Extensions.Hosting;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Initializes the DuckDB star schema on application startup, prior to serving requests.
/// </summary>
public sealed class DuckDbSchemaHostedService : IHostedService
{
    private readonly IDuckDbSchemaInitializer _schemaInitializer;

    public DuckDbSchemaHostedService(IDuckDbSchemaInitializer schemaInitializer)
    {
        ArgumentNullException.ThrowIfNull(schemaInitializer);
        _schemaInitializer = schemaInitializer;
    }

    public Task StartAsync(CancellationToken cancellationToken) =>
        _schemaInitializer.InitializeAsync(cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
