using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Opciones del normalizador de grilla (sección "GridNormalization").
/// </summary>
public sealed class GridNormalizationOptions
{
    public const string SectionName = "GridNormalization";
    public const string DefaultOutputDirectory = "data/nasa/normalized";

    /// <summary>
    /// Directorio donde se escriben los Parquet normalizados (relativo al directorio de trabajo).
    /// </summary>
    public string OutputDirectory { get; set; } = DefaultOutputDirectory;

    /// <summary>
    /// Mapeo de columnas por variable, con clave = nombre del enum ClimateVariable (p.ej. "Gistemp").
    /// </summary>
    public Dictionary<string, GridColumnMapping> Mappings { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Reglas de limpieza (fill values y rangos físicos válidos) por variable.
    /// </summary>
    public DataCleaningOptions Cleaning { get; set; } = new();

    public GridColumnMapping ResolveMapping(string variableName) =>
        Mappings.TryGetValue(variableName, out var mapping) ? mapping : GridColumnMapping.Default;
}
