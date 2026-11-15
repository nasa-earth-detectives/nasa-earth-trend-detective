namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Annual time series for a grid cell, ordered by year: input for per-cell trend analysis.
/// </summary>
public sealed record CellAnnualSeries(
    double Latitude,
    double Longitude,
    IReadOnlyList<AnnualObservation> Years);
