using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

public class RegionalTrendSummaryDto
{
    public string RegionId { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public ClimateVariable Variable { get; set; }
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public IReadOnlyList<AnnualObservation> Observations { get; set; } = Array.Empty<AnnualObservation>();
    public TrendResultDto Stats { get; set; } = new();
}

public class OpposingTrendPairDto
{
    public string PairId { get; set; } = string.Empty;
    public string DriverProcess { get; set; } = string.Empty;
    public RegionalTrendSummaryDto IncreasingRegion { get; set; } = new();
    public RegionalTrendSummaryDto DecreasingRegion { get; set; } = new();
    public double DivergenceIndex { get; set; }
    public string ScientificNotes { get; set; } = string.Empty;
}
