using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Loads Parquet + manifest pairs from a directory into DuckDB. Idempotent: an already loaded
/// Parquet file (matching SHA-256) is not re-imported; a changed file replaces facts for its variable.
/// </summary>
public interface IDatasetSeeder
{
    /// <param name="directory">Directory to seed; null uses DatasetSeed:Directory.</param>
    Task<IReadOnlyList<DatasetSeedOutcome>> SeedAsync(
        string? directory = null,
        CancellationToken cancellationToken = default);
}
