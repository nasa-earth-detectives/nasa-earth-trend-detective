namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Resultado de la normalización: Parquet generado, conteo de filas escritas/descartadas
/// (coordenadas o tiempo inválidos) y métricas de calidad de la etapa de limpieza.
/// </summary>
public sealed record GridNormalizationResult(
    string OutputPath,
    long SourceRows,
    long RowsWritten,
    DataQualityMetrics Quality)
{
    public long RowsDiscarded => SourceRows - RowsWritten;
}
