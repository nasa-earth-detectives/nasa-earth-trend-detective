using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Data access contract for observed climate data in the application layer.
/// Decouples analytical use cases from the storage engine (DuckDB).
/// </summary>
public interface ITrendObservationRepository
{
    Task<IReadOnlyList<AnnualObservation>> GetAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        double? latitude = null,
        double? longitude = null,
        double toleranceDegrees = 1.0,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrendObservation>> GetObservationsByYearAsync(
        ClimateVariable variable,
        int year,
        CancellationToken cancellationToken = default);
}
