using System.Data;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;
using NasaTrendDetective.Infrastructure.Queries;
using NasaTrendDetective.Infrastructure.Queries.Models;

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

    public async Task<ParquetImportResult> ExecuteParquetIngestAsync(
        string parquetGlob,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parquetGlob);
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);
        return await ParquetIngestion.RunAsync(connection, parquetGlob, cancellationToken).ConfigureAwait(false);
    }

    public Task<IReadOnlyList<CellAggregate>> GetCellAggregatesAsync(
        CellAggregationRequest request,
        CancellationToken cancellationToken = default)
    {
        var (sql, parameters) = CellAggregationSql.Build(request);
        return QueryAsync(sql, CellAggregationSql.Map, parameters, cancellationToken);
    }
}
