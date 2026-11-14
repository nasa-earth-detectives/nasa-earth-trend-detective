namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Mann-Kendall / Sen verdict for a single cell. <see cref="SensSlope"/> is expressed in
/// <see cref="GridTrendResultDto.Unit"/> (per year).
/// </summary>
public class GridTrendCellDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double SensSlope { get; set; }
    public double SensSlopePerDecade { get; set; }
    public double MannKendallZ { get; set; }
    public double PValue { get; set; }
    public bool IsSignificant { get; set; }
    public string Direction { get; set; } = string.Empty;

    /// <summary>Number of years included in the cell's analysis.</summary>
    public int Years { get; set; }
}
