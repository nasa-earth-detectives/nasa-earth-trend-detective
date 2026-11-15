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

    /// <summary>
    /// Peak allocation of a task above which DuckDB hands the memory it freed back to the system
    /// (allocator_flush_threshold, e.g. "16MB"); empty = DuckDB default (128 MB).
    /// <see cref="MemoryLimit"/> bounds what DuckDB uses, not what its allocator keeps after freeing it.
    /// Measured in a 512 MB container with a 110 MB limit: each trend grid query left the process
    /// higher (157 MB at startup, 439 MB after nine grids, the managed heap under 40 MB all along)
    /// until the tenth got the container killed. No query here peaks above the default threshold, so
    /// the allocator never gave anything back.
    /// </summary>
    public string? AllocatorFlushThreshold { get; set; }

    /// <summary>Lets the allocator return freed memory from a background thread (allocator_background_threads).</summary>
    public bool? AllocatorBackgroundThreads { get; set; }

    public bool IsInMemory =>
        string.IsNullOrWhiteSpace(DatabasePath)
        || string.Equals(DatabasePath.Trim(), InMemoryPath, StringComparison.OrdinalIgnoreCase);
}
