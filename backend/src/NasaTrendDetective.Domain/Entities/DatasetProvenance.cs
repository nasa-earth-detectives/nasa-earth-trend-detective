using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Provenance of the loaded dataset for a variable: indicates where each value returned by the API originates.
/// Changing data source (e.g., when an official dataset is delivered) involves loading a different manifest
/// and Parquet file; neither API contracts nor the frontend depend on a specific data source.
/// </summary>
/// <param name="Unit">Measurement unit of observations (e.g., "°C Anomaly").</param>
/// <param name="TrendUnit">Unit of Sen's slope per year (e.g., "°C / year").</param>
/// <param name="Interim">Provisional source, to be replaced when an official source arrives.</param>
/// <param name="RowCount">Total facts loaded into DuckDB for this variable.</param>
public sealed record DatasetProvenance(
    ClimateVariable Variable,
    string Provider,
    string Product,
    string Unit,
    string TrendUnit,
    string? Baseline,
    double ResolutionDegrees,
    string SourceUrl,
    string SourceFile,
    string SourceSha256,
    DateTimeOffset RetrievedAt,
    int CoverageStart,
    int CoverageEnd,
    string LastMonth,
    bool Interim,
    string Citation,
    long RowCount,
    DateTimeOffset LoadedAt);
