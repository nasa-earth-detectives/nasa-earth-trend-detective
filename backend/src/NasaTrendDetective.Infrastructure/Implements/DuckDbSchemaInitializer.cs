using System.Data.Common;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Ejecuta init_schema.sql sobre una conexión de la fábrica DuckDB. El script es idempotente,
/// por lo que puede invocarse en cada arranque sin efectos secundarios.
/// </summary>
public sealed class DuckDbSchemaInitializer : IDuckDbSchemaInitializer
{
    /// <summary>
    /// Las bases creadas antes de MERRA-2 limitan dim_variable a los ids 1-4 con un CHECK, y
    /// CREATE TABLE IF NOT EXISTS no lo quita: sembrar una variable nueva fallaría para siempre.
    /// </summary>
    private const string LegacyVariableCheck = """
        SELECT count(*) FROM duckdb_constraints()
        WHERE table_name = 'dim_variable' AND constraint_type = 'CHECK'
        """;

    /// <summary>
    /// DuckDB no permite soltar un CHECK, así que se reconstruyen las tres tablas atadas por la clave
    /// foránea. No se pierde nada irrecuperable: los hechos y su procedencia salen de los Parquet
    /// sembrados, y el sembrado que corre después de este paso los vuelve a cargar.
    /// </summary>
    private const string DropLegacyTables = """
        DROP TABLE IF EXISTS dataset_provenance;
        DROP TABLE IF EXISTS fact_climate_observations;
        DROP TABLE IF EXISTS dim_variable;
        """;

    private readonly IDuckDbConnectionFactory _connectionFactory;

    public DuckDbSchemaInitializer(IDuckDbConnectionFactory connectionFactory)
    {
        ArgumentNullException.ThrowIfNull(connectionFactory);
        _connectionFactory = connectionFactory;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        if (await HasLegacyVariableCheckAsync(connection, cancellationToken).ConfigureAwait(false))
        {
            await ExecuteAsync(connection, DropLegacyTables, cancellationToken).ConfigureAwait(false);
        }

        await ExecuteAsync(connection, DuckDbSchemaScript.InitSchemaSql, cancellationToken).ConfigureAwait(false);
    }

    private static async Task<bool> HasLegacyVariableCheckAsync(DbConnection connection, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = LegacyVariableCheck;
        var count = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return Convert.ToInt64(count, System.Globalization.CultureInfo.InvariantCulture) > 0;
    }

    private static async Task ExecuteAsync(DbConnection connection, string sql, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}
