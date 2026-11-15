namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Initializes (idempotently) the analytical star schema in DuckDB.
/// </summary>
public interface IDuckDbSchemaInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
