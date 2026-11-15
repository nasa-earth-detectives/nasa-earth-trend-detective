using System.Data;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Queries.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Asynchronous access to the DuckDB OLAP engine. Each operation uses an isolated connection.
/// Parameters are bound by name ($name in SQL).
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

    Task StreamQueryAsync(
        string sql,
        Action<IDataRecord> handleRow,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default);

    Task<int> ExecuteAsync(
        string sql,
        IReadOnlyDictionary<string, object?>? parameters = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk imports canonical Parquet files matching the glob (e.g. 'data/nasa/normalized/*.parquet') into
    /// fact_climate_observations using INSERT ... SELECT FROM read_parquet, after validating schema.
    /// </summary>
    Task<ParquetImportResult> ExecuteParquetIngestAsync(
        string parquetGlob,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Global aggregation per spatial cell (rounded lat/lng): annual average per variable and year.
    /// </summary>
    Task<IReadOnlyList<CellAggregate>> GetCellAggregatesAsync(
        CellAggregationRequest request,
        CancellationToken cancellationToken = default);
}
