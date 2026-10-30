namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Opciones del sembrado de datasets al arrancar (sección "DatasetSeed"). La variable de entorno
/// DATASET_SEED_DIRECTORY tiene prioridad sobre <see cref="Directory"/>.
/// </summary>
public sealed class DatasetSeedOptions
{
    public const string SectionName = "DatasetSeed";
    public const string EnvironmentVariable = "DATASET_SEED_DIRECTORY";

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Carpeta con los pares &lt;nombre&gt;.parquet + &lt;nombre&gt;.provenance.json (relativa al
    /// directorio de trabajo, igual que GridNormalization:OutputDirectory).
    /// </summary>
    public string Directory { get; set; } = GridNormalizationOptions.DefaultOutputDirectory;
}
