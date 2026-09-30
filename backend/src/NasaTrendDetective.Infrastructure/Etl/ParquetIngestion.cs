using DuckDB.NET.Data;
using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Carga masiva de Parquet canónicos a fact_climate_observations sobre una conexión abierta:
/// comprueba el glob, valida el esquema con DESCRIBE y ejecuta el INSERT ... SELECT en una transacción
/// (hechos + celdas de dim_location), con rollback completo si algo falla.
/// </summary>
internal static class ParquetIngestion
{
    public static async Task<ParquetImportResult> RunAsync(
        DuckDBConnection connection,
        string sourceGlob,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceGlob);
        var glob = sourceGlob.Trim().Replace('\\', '/');

        var files = await DuckDbEtlCommands.ScalarAsync(connection, ParquetImportSql.CountFiles(glob), ct)
            .ConfigureAwait(false);
        if (files == 0)
        {
            throw new ParquetImportException($"No se encontraron archivos Parquet para el patrón '{glob}'.");
        }

        CanonicalParquetSchema.Validate(await DescribeAsync(connection, glob, ct).ConfigureAwait(false), glob);
        var sourceRows = await DuckDbEtlCommands.ScalarAsync(connection, ParquetImportSql.CountRows(glob), ct)
            .ConfigureAwait(false);

        await DuckDbEtlCommands.ExecuteAsync(connection, "BEGIN TRANSACTION", ct).ConfigureAwait(false);
        try
        {
            var previousMaxId = await DuckDbEtlCommands
                .ScalarAsync(connection, ParquetImportSql.MaxObservationId, ct)
                .ConfigureAwait(false);
            var imported = await ExecuteNonQueryAsync(
                    connection, ParquetImportSql.InsertFacts(glob, previousMaxId), ct)
                .ConfigureAwait(false);
            await ExecuteNonQueryAsync(connection, ParquetImportSql.InsertLocations(previousMaxId), ct)
                .ConfigureAwait(false);
            await DuckDbEtlCommands.ExecuteAsync(connection, "COMMIT", CancellationToken.None)
                .ConfigureAwait(false);
            return new ParquetImportResult(glob, files, sourceRows, imported);
        }
        catch
        {
            await DuckDbEtlCommands.ExecuteAsync(connection, "ROLLBACK", CancellationToken.None)
                .ConfigureAwait(false);
            throw;
        }
    }

    private static async Task<IReadOnlyList<(string Name, string Type)>> DescribeAsync(
        DuckDBConnection connection,
        string glob,
        CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = ParquetImportSql.Describe(glob);
        await using var reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);
        var nameOrdinal = reader.GetOrdinal("column_name");
        var typeOrdinal = reader.GetOrdinal("column_type");
        var columns = new List<(string Name, string Type)>();
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            columns.Add((reader.GetString(nameOrdinal), reader.GetString(typeOrdinal)));
        }

        return columns;
    }

    private static async Task<long> ExecuteNonQueryAsync(DuckDBConnection connection, string sql, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        return await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}
