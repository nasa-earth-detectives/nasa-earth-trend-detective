using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl.Models;

public enum DatasetSeedStatus
{
    /// <summary>Hechos reemplazados y procedencia registrada.</summary>
    Imported,

    /// <summary>El Parquet ya estaba cargado (mismo SHA-256): no se tocó nada.</summary>
    Unchanged,

    /// <summary>Manifiesto sin Parquet hermano.</summary>
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
