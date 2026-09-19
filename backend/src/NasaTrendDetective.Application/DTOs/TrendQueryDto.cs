using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

public class TrendQueryDto
{
    public ClimateVariable Variable { get; set; } = ClimateVariable.Gistemp;
    public int StartYear { get; set; } = 2002;
    public int EndYear { get; set; } = 2024;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
