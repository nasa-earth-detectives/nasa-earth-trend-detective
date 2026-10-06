namespace NasaTrendDetective.Domain.Entities;

/// <summary>
/// Serie anual de una celda de la grilla, ordenada por año: la entrada del análisis de tendencia por celda.
/// </summary>
public sealed record CellAnnualSeries(
    double Latitude,
    double Longitude,
    IReadOnlyList<AnnualObservation> Years);
