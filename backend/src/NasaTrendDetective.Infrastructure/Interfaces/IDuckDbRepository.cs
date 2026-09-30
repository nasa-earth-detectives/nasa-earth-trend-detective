using System.Data;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Queries.Models;

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

    /// <summary>
    /// Importa en bloque los Parquet canónicos del glob (p.ej. 'data/nasa/normalized/*.parquet') a
    /// fact_climate_observations con INSERT ... SELECT FROM read_parquet, validando antes el esquema.
    /// </summary>
    Task<ParquetImportResult> ExecuteParquetIngestAsync(
        string parquetGlob,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Agregación global por celda espacial (lat/lng redondeados): promedio por variable y año.
    /// </summary>
    Task<IReadOnlyList<CellAggregate>> GetCellAggregatesAsync(
        CellAggregationRequest request,
        CancellationToken cancellationToken = default);
}
