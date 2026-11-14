namespace NasaTrendDetective.Infrastructure.Queries.Models;

/// <summary>
/// Annual average of a variable in a grid cell (rounded lat/lng). Averages ignore analytical
/// NULLs and evaluate to NULL if the cell has no valid values for that year.
/// </summary>
public sealed record CellAggregate(
    byte VariableId,
    int Year,
    double Latitude,
    double Longitude,
    double? AverageValue,
    double? AverageAnomaly,
    long ObservationCount,
    long ValidObservationCount);
