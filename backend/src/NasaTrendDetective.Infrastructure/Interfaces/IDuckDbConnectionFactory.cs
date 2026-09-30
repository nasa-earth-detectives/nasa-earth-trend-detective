using DuckDB.NET.Data;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Crea conexiones DuckDB aisladas (una por operación) listas para usarse.
/// </summary>
public interface IDuckDbConnectionFactory
{
    string ConnectionString { get; }

    bool IsInMemory { get; }

    Task<DuckDBConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default);
}
