namespace NasaTrendDetective.Domain.Entities;

public sealed record AnnualObservation(
    int Year,
    double Value,
    double? Anomaly = null);
