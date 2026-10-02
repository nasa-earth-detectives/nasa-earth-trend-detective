using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Contrato de acceso a datos climáticos observados para la capa de aplicación.
/// Permite desacoplar los casos de uso analíticos del motor de almacenamiento (DuckDB).
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
