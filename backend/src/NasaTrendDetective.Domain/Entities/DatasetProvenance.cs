using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Procedencia del dataset cargado para una variable: de dónde sale cada número que muestra la API.
/// Cambiar de fuente (p.ej. cuando el reto entregue la oficial) es cargar otro manifiesto y otro
/// Parquet; ni los contratos de la API ni el frontend dependen de la fuente concreta.
/// </summary>
/// <param name="Unit">Unidad de las observaciones (p.ej. "°C Anomaly").</param>
/// <param name="TrendUnit">Unidad de la pendiente de Sen por año (p.ej. "°C / año").</param>
/// <param name="Interim">Fuente provisional, a reemplazar cuando llegue la fuente oficial.</param>
/// <param name="RowCount">Hechos cargados en DuckDB para la variable.</param>
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
