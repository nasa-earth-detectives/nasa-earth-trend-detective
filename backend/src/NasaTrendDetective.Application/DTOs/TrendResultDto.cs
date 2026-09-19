using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

public class TrendResultDto
{
    public ClimateVariable Variable { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public double SensSlope { get; set; }
    public double MannKendallZ { get; set; }
    public double PValue { get; set; }
    public bool IsSignificant { get; set; }
    public string Direction { get; set; } = string.Empty;
}
