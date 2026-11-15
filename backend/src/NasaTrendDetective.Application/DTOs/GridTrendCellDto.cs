namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Mann-Kendall / Sen verdict for a grid cell. <see cref="SensSlope"/> is in
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

    /// <summary>Mann-Kendall p-value after removing year-to-year persistence (prewhitening).</summary>
    public double PrewhitenedPValue { get; set; }

    /// <summary>q-value: the prewhitened p-value adjusted via Benjamini-Hochberg across all map cells.</summary>
    public double AdjustedPValue { get; set; }

    /// <summary>
    /// Trend that survives both corrections: year-to-year persistence and multiple comparisons
    /// (q &lt;= <see cref="GridTrendResultDto.FalseDiscoveryRate"/>).
    /// </summary>
    public bool IsSignificantCorrected { get; set; }

    /// <summary>Number of years included in the cell analysis.</summary>
    public int Years { get; set; }
}
