namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Whether startup seeding has finished. Seeding runs in the background, so right after boot the
/// catalog can be incomplete: this lets the API say "loading" instead of "no data", and lets the
/// trend-grid warm-up wait until the datasets are in place.
/// </summary>
public interface IDatasetSeedState
{
    bool IsCompleted { get; }

    /// <summary>Completes when seeding ends, whether it succeeded, failed, or was disabled.</summary>
    Task Completed { get; }
}
