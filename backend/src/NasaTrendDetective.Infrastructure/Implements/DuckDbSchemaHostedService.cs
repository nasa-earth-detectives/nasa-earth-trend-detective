using Microsoft.Extensions.Hosting;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Inicializa el esquema estrella de DuckDB al arrancar el host, antes de atender peticiones.
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
