namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Bulk Parquet importer options for fact_climate_observations ("ParquetImport" section).
/// </summary>
public sealed class ParquetImportOptions
{
    public const string SectionName = "ParquetImport";

    /// <summary>
    /// Defaults to grid normalizer output directory (data/nasa/normalized).
    /// </summary>
    public const string DefaultSourceGlob = "data/nasa/normalized/*.parquet";

    /// <summary>
    /// DuckDB glob pattern (supports * and **) relative to working directory or absolute.
    /// </summary>
    public string SourceGlob { get; set; } = DefaultSourceGlob;
}
