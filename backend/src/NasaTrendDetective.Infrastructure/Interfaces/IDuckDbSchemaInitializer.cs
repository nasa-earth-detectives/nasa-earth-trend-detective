namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Crea (de forma idempotente) el esquema estrella analítico en DuckDB.
/// </summary>
public interface IDuckDbSchemaInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
