using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Ejecuta init_schema.sql sobre una conexión de la fábrica DuckDB. El script es idempotente,
/// por lo que puede invocarse en cada arranque sin efectos secundarios.
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
