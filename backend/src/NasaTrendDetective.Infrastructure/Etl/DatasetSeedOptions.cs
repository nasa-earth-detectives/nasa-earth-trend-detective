namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Startup dataset seeding options ("DatasetSeed" section). Environment variable
/// DATASET_SEED_DIRECTORY takes precedence over <see cref="Directory"/>.
/// </summary>
public sealed class DatasetSeedOptions
{
    public const string SectionName = "DatasetSeed";
    public const string EnvironmentVariable = "DATASET_SEED_DIRECTORY";

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Directory containing the &lt;name&gt;.parquet + &lt;name&gt;.provenance.json pairs (relative to
    /// the working directory, matching GridNormalization:OutputDirectory).
    /// </summary>
    public string Directory { get; set; } = GridNormalizationOptions.DefaultOutputDirectory;
}
