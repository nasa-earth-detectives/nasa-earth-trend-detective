using System.Globalization;
using DuckDB.NET.Data;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Comandos DuckDB reutilizados por el pipeline ETL (escalares, DDL y lectura de métricas de calidad).
/// </summary>
internal static class DuckDbEtlCommands
{
    public static async Task<long> ScalarAsync(DuckDBConnection connection, string sql, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        var value = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return Convert.ToInt64(value, CultureInfo.InvariantCulture);
    }

    public static async Task ExecuteAsync(DuckDBConnection connection, string sql, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Calcula las métricas de calidad sobre la tabla limpia (columnas is_valid, is_imputed, value).
    /// </summary>
    public static async Task<DataQualityMetrics> ReadQualityAsync(
        DuckDBConnection connection,
        string cleanTable,
        ClimateVariable variable,
        CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            SELECT count(*),
                   count(*) FILTER (WHERE is_valid),
                   count(*) FILTER (WHERE is_imputed),
                   count(value)
            FROM {DuckDbSqlText.Identifier(cleanTable)}
            """;
        await using var reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);
        await reader.ReadAsync(ct).ConfigureAwait(false);
        return new DataQualityMetrics(
            variable,
            ReadLong(reader, 0),
            ReadLong(reader, 1),
            ReadLong(reader, 2),
            ReadLong(reader, 3));
    }

    private static long ReadLong(System.Data.Common.DbDataReader reader, int ordinal) =>
        Convert.ToInt64(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
}
