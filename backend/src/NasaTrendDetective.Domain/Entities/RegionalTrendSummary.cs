using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Domain.Entities;

public sealed record RegionalTrendSummary(
    string RegionId,
    string RegionName,
    double Latitude,
    double Longitude,
    ClimateVariable Variable,
    int StartYear,
    int EndYear,
    IReadOnlyList<AnnualObservation> Observations,
    StatisticalVerdict Stats);
