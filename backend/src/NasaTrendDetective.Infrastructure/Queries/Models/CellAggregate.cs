namespace NasaTrendDetective.Infrastructure.Queries.Models;

/// <summary>
/// Promedio anual de una variable en una celda (lat/lng redondeados). Los promedios ignoran los NULL
/// analíticos y son NULL si la celda no tiene ningún valor válido ese año.
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
