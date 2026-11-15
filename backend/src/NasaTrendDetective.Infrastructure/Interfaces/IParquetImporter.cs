using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Bulk importer of canonical Parquet files from normalizer into fact_climate_observations.
/// </summary>
public interface IParquetImporter
{
    /// <summary>
    /// Imports files matching the specified glob, or defaults to "ParquetImport:SourceGlob" if null.
    /// </summary>
    Task<ParquetImportResult> ImportAsync(string? sourceGlob = null, CancellationToken cancellationToken = default);
}
