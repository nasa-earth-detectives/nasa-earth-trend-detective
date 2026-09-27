using System.Globalization;
using DuckDB.NET.Data;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Comandos DuckDB reutilizados por el pipeline ETL (escalares y DDL).
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
}
