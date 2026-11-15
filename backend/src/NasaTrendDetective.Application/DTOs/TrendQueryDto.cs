using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

public class TrendQueryDto
{
    public ClimateVariable Variable { get; set; } = ClimateVariable.Gistemp;
    public int StartYear { get; set; } = 2000;
    public int EndYear { get; set; } = 2025;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    /// <summary>
    /// Half-height and half-width, in degrees, of the box analysed around the point. Left out, the box
    /// is the 2° × 2° around the point, as always. Given, the series is the area-weighted mean of every
    /// cell inside: that is how a whole region (the Amazon, the Sahara) is analysed instead of one spot.
    /// </summary>
    public double? LatitudeRadius { get; set; }
    public double? LongitudeRadius { get; set; }
}
