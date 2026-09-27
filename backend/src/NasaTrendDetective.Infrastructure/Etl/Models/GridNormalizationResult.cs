namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Resultado de la normalización: Parquet generado y conteo de filas válidas/descartadas.
/// </summary>
public sealed record GridNormalizationResult(string OutputPath, long SourceRows, long RowsWritten)
{
    public long RowsDiscarded => SourceRows - RowsWritten;
}
