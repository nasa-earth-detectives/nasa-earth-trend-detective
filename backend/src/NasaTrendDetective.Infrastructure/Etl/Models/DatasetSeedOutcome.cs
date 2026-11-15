using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl.Models;

public enum DatasetSeedStatus
{
    /// <summary>Facts replaced and provenance recorded.</summary>
    Imported,

    /// <summary>Parquet was already loaded (matching SHA-256): no changes made.</summary>
    Unchanged,

    /// <summary>Manifest without a sibling Parquet file.</summary>
    Skipped,

    Failed,
}

public sealed record DatasetSeedOutcome(
    string ManifestFile,
    ClimateVariable? Variable,
    DatasetSeedStatus Status,
    long Rows,
    TimeSpan Elapsed,
    string Message);
