using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Grid normalizer configuration options ("GridNormalization" section).
/// </summary>
public sealed class GridNormalizationOptions
{
    public const string SectionName = "GridNormalization";
    public const string DefaultOutputDirectory = "data/nasa/normalized";

    /// <summary>
    /// Directory where normalized Parquet files are written (relative to working directory).
    /// </summary>
    public string OutputDirectory { get; set; } = DefaultOutputDirectory;

    /// <summary>
    /// Column mapping per variable, keyed by ClimateVariable enum name (e.g. "Gistemp").
    /// </summary>
    public Dictionary<string, GridColumnMapping> Mappings { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Cleaning rules (fill values and valid physical ranges) per variable.
    /// </summary>
    public DataCleaningOptions Cleaning { get; set; } = new();

    public GridColumnMapping ResolveMapping(string variableName) =>
        Mappings.TryGetValue(variableName, out var mapping) ? mapping : GridColumnMapping.Default;
}
