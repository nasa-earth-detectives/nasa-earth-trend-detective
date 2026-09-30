namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Opciones de configuración del motor analítico embebido DuckDB (sección "DuckDb").
/// </summary>
public sealed class DuckDbOptions
{
    public const string SectionName = "DuckDb";
    public const string EnvironmentVariable = "DUCKDB_DATABASE_PATH";
    public const string InMemoryPath = ":memory:";
    public const string DefaultDatabasePath = "nasa_earth_trends.duckdb";

    /// <summary>
    /// Ruta del archivo local .duckdb o ":memory:" para una base efímera en memoria.
    /// </summary>
    public string DatabasePath { get; set; } = DefaultDatabasePath;

    public bool IsInMemory =>
        string.IsNullOrWhiteSpace(DatabasePath)
        || string.Equals(DatabasePath.Trim(), InMemoryPath, StringComparison.OrdinalIgnoreCase);
}
