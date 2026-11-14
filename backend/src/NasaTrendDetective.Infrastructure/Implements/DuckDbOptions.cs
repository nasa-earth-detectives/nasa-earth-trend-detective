namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Configuration options for embedded DuckDB OLAP engine ("DuckDb" section).
/// </summary>
public sealed class DuckDbOptions
{
    public const string SectionName = "DuckDb";
    public const string EnvironmentVariable = "DUCKDB_DATABASE_PATH";
    public const string InMemoryPath = ":memory:";
    public const string DefaultDatabasePath = "nasa_earth_trends.duckdb";

    /// <summary>
    /// Path to local .duckdb file or ":memory:" for ephemeral in-memory database.
    /// </summary>
    public string DatabasePath { get; set; } = DefaultDatabasePath;

    /// <summary>
    /// DuckDB memory ceiling (e.g. "256MB"); empty = default DuckDB ceiling (80% of detected RAM).
    /// On constrained containers (Render free tier: 512 MB) this must be set: unconstrained Parquet
    /// import of GISTEMP reached 647 MB, and DuckDB does not always detect container cgroup limits.
    /// With a ceiling, overflow is written to temporary disk storage rather than crashing the process.
    /// </summary>
    public string? MemoryLimit { get; set; }

    /// <summary>
    /// Directory where DuckDB spills overflow exceeding <see cref="MemoryLimit"/>; null = "&lt;database&gt;.tmp".
    /// Created explicitly: on Windows DuckDB does not auto-create missing spill directories, causing IO errors.
    /// </summary>
    public string? TempDirectory { get; set; }

    /// <summary>DuckDB worker threads; null = all CPU cores. Fewer threads reduce simultaneous buffer allocations.</summary>
    public int? Threads { get; set; }

    public bool IsInMemory =>
        string.IsNullOrWhiteSpace(DatabasePath)
        || string.Equals(DatabasePath.Trim(), InMemoryPath, StringComparison.OrdinalIgnoreCase);
}
