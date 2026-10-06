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

    /// <summary>
    /// Tope de memoria de DuckDB (p.ej. "256MB"); vacío = el de DuckDB (80 % de la RAM que detecta).
    /// En un contenedor pequeño (Render gratuito: 512 MB) hay que fijarlo: la importación del Parquet
    /// de GISTEMP llegó a 647 MB sin tope, y DuckDB no siempre ve el límite del contenedor. Con tope,
    /// lo que no cabe se escribe en disco temporal en vez de tumbar el proceso.
    /// </summary>
    public string? MemoryLimit { get; set; }

    /// <summary>
    /// Carpeta donde DuckDB vuelca lo que no cabe en <see cref="MemoryLimit"/>; null = "&lt;base&gt;.tmp".
    /// Se crea explícitamente: en Windows DuckDB 1.5 no la creó y la importación falló con "IO Error".
    /// </summary>
    public string? TempDirectory { get; set; }

    /// <summary>Hilos de DuckDB; null = todos los núcleos. Menos hilos, menos búferes simultáneos.</summary>
    public int? Threads { get; set; }

    public bool IsInMemory =>
        string.IsNullOrWhiteSpace(DatabasePath)
        || string.Equals(DatabasePath.Trim(), InMemoryPath, StringComparison.OrdinalIgnoreCase);
}
