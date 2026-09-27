using System.Data;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Repositorio real sobre DuckDB embebido. Abre una conexión aislada por operación y la libera
/// al terminar para evitar bloqueos entre peticiones concurrentes.
/// </summary>
public sealed class DuckDbRepository : IDuckDbRepository
{
    private readonly IDuckDbConnectionFactory _connectionFactory;

    public DuckDbRepository(IDuckDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        var result = await ExecuteScalarAsync<int>("SELECT 1", null, cancellationToken).ConfigureAwait(false);
        return result == 1;
    }

    public async Task<string> GetVersionAsync(CancellationToken cancellationToken = default)
    {
        var version = await ExecuteScalarAsync<string>("SELECT version()", null, cancellationToken)
            .ConfigureAwait(false);
        return version ?? string.Empty;
    }

    public async Task<T?> ExecuteScalarAsync<T>(
        string sql,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var command = DuckDbCommandHelper.CreateCommand(connection, sql, parameters);
        var value = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
        return DuckDbCommandHelper.ConvertScalar<T>(value);
    }

    public async Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        Func<IDataRecord, T> map,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(map);
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var command = DuckDbCommandHelper.CreateCommand(connection, sql, parameters);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var results = new List<T>();
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            results.Add(map(reader));
        }

        return results;
    }

    public async Task<int> ExecuteAsync(
        string sql,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var command = DuckDbCommandHelper.CreateCommand(connection, sql, parameters);
        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public Task ExecuteParquetIngestAsync(
        string parquetFilePath,
        string tableName,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parquetFilePath);
        var table = DuckDbCommandHelper.QuoteIdentifier(tableName);
        var parameters = new Dictionary<string, object?> { ["path"] = parquetFilePath };

        return ExecuteAsync(
            $"CREATE OR REPLACE TABLE {table} AS SELECT * FROM read_parquet($path)",
            parameters,
            cancellationToken);
    }
}
