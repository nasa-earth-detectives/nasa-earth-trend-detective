namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Normalization result: generated Parquet file, count of rows written/discarded
/// (invalid coordinates or timestamp), and quality metrics from the cleaning stage.
/// </summary>
public sealed record GridNormalizationResult(
    string OutputPath,
    long SourceRows,
    long RowsWritten,
    DataQualityMetrics Quality)
{
    public long RowsDiscarded => SourceRows - RowsWritten;
}
