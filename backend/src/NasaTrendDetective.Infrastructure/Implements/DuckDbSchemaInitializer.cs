using System.Data.Common;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Executes init_schema.sql against a connection from the DuckDB factory. The script is idempotent
/// and can be invoked on each startup without side effects.
/// </summary>
public sealed class DuckDbSchemaInitializer : IDuckDbSchemaInitializer
{
    /// <summary>
    /// Databases created before MERRA-2 restrict dim_variable to ids 1-4 with a CHECK constraint, and
    /// CREATE TABLE IF NOT EXISTS does not remove it: seeding a new variable would fail forever.
    /// </summary>
    private const string LegacyVariableCheck = """
        SELECT count(*) FROM duckdb_constraints()
        WHERE table_name = 'dim_variable' AND constraint_type = 'CHECK'
        """;

    /// <summary>
    /// DuckDB does not allow dropping a CHECK constraint, so the three tables linked by the foreign key
    /// are rebuilt. Nothing irrecoverable is lost: facts and their provenance come from the seeded
    /// Parquet files, and the seeding step that runs after this reloads them.
    /// </summary>
    private const string DropLegacyTables = """
        DROP TABLE IF EXISTS fact_annual_cell;
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
