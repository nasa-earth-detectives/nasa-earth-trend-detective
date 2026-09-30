using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Importador masivo de los Parquet canónicos del normalizador a fact_climate_observations.
/// </summary>
public interface IParquetImporter
{
    /// <summary>
    /// Importa los archivos del glob indicado o, si es null, del configurado en "ParquetImport:SourceGlob".
    /// </summary>
    Task<ParquetImportResult> ImportAsync(string? sourceGlob = null, CancellationToken cancellationToken = default);
}
