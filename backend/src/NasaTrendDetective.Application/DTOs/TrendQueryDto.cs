using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

public class TrendQueryDto
{
    public ClimateVariable Variable { get; set; } = ClimateVariable.Gistemp;
    public int StartYear { get; set; } = 2000;
    public int EndYear { get; set; } = 2025;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
