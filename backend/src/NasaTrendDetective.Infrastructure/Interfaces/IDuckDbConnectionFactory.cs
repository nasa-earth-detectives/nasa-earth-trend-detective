using DuckDB.NET.Data;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Creates isolated DuckDB connections (one per operation) ready for use.
/// </summary>
public interface IDuckDbConnectionFactory
{
    string ConnectionString { get; }

    bool IsInMemory { get; }

    Task<DuckDBConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default);
}
