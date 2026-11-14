using NasaTrendDetective.Domain.Entities;
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
    public double SensSlopePerDecade { get; set; }
    public double MannKendallZ { get; set; }
    public double SStatistic { get; set; }
    public double VarianceS { get; set; }
    public double PValue { get; set; }
    public bool IsSignificant { get; set; }
    public string Direction { get; set; } = string.Empty;
    public double[] ConfidenceInterval95 { get; set; } = Array.Empty<double>();

    /// <summary>Linear regression t-test: slope per year, 95% CI, t, and p-value.</summary>
    public LinearTrendVerdict Linear { get; set; } = LinearTrendVerdict.Inconclusive;

    /// <summary>Prewhitened Mann-Kendall: lag-1 year-to-year autocorrelation, Z-score, and p-value.</summary>
    public PrewhitenedTrendVerdict Prewhitened { get; set; } = PrewhitenedTrendVerdict.Inconclusive;
    public IReadOnlyList<AnnualObservation>? Observations { get; set; }

    /// <summary>"observed" (DuckDB) or "synthetic" (demonstration series: the variable has no loaded dataset).</summary>
    public string Source { get; set; } = DatasetStatusDto.Synthetic;
}
