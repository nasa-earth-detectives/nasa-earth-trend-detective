using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Executes init_schema.sql against a connection from the DuckDB factory. The script is idempotent
/// and can be invoked on each startup without side effects.
/// </summary>
public sealed class DuckDbSchemaInitializer : IDuckDbSchemaInitializer
{
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
        await using var command = connection.CreateCommand();
        command.CommandText = DuckDbSchemaScript.InitSchemaSql;
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }
}
