namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Opciones del importador masivo de Parquet a fact_climate_observations (sección "ParquetImport").
/// </summary>
public sealed class ParquetImportOptions
{
    public const string SectionName = "ParquetImport";

    /// <summary>
    /// Por defecto apunta a la salida del normalizador de grilla (data/nasa/normalized).
    /// </summary>
    public const string DefaultSourceGlob = "data/nasa/normalized/*.parquet";

    /// <summary>
    /// Patrón glob de DuckDB (admite * y **) relativo al directorio de trabajo o absoluto.
    /// </summary>
    public string SourceGlob { get; set; } = DefaultSourceGlob;
}
