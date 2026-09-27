using System.Data;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Acceso asíncrono al motor OLAP DuckDB. Cada operación usa una conexión aislada.
/// Los parámetros se enlazan por nombre ($nombre en SQL).
/// </summary>
public interface IDuckDbRepository
{
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);

    Task<string> GetVersionAsync(CancellationToken cancellationToken = default);

    Task<T?> ExecuteScalarAsync<T>(
        string sql,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        Func<IDataRecord, T> map,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default);

    Task<int> ExecuteAsync(
        string sql,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default);

    Task ExecuteParquetIngestAsync(
        string parquetFilePath,
        string tableName,
        CancellationToken cancellationToken = default);
}
