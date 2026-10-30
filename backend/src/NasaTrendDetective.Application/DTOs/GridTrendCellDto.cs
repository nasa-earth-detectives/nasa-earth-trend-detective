namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Veredicto Mann-Kendall / Sen de una celda. <see cref="SensSlope"/> va en la unidad
/// <see cref="GridTrendResultDto.Unit"/> (por año).
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

    /// <summary>Años que entraron en el análisis de la celda.</summary>
    public int Years { get; set; }
}
