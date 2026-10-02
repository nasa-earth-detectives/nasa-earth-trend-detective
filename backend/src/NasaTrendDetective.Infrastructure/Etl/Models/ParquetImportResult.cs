namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Resultado de una importación: archivos que casaron con el glob, filas leídas del Parquet
/// y filas nuevas insertadas en fact_climate_observations (las ya existentes o con coordenadas
/// fuera de rango no se insertan; varias filas del mismo mes y celda se consolidan en una).
/// </summary>
public sealed record ParquetImportResult(
    string SourceGlob,
    long FilesMatched,
    long SourceRows,
    long RowsImported);
