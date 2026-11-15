namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Import result: files matched by the glob, rows read from Parquet,
/// and new rows inserted into fact_climate_observations (existing rows or out-of-range
/// coordinates are skipped; multiple rows for the same month and cell are consolidated into one).
/// </summary>
public sealed record ParquetImportResult(
    string SourceGlob,
    long FilesMatched,
    long SourceRows,
    long RowsImported);
