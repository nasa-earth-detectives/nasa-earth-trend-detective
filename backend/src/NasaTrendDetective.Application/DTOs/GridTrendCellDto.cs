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

    /// <summary>Valor p de Mann-Kendall tras descontar la persistencia entre años (preblanqueo).</summary>
    public double PrewhitenedPValue { get; set; }

    /// <summary>Valor q: el p anterior ajustado por Benjamini-Hochberg entre todas las celdas del mapa.</summary>
    public double AdjustedPValue { get; set; }

    /// <summary>
    /// Tendencia que sobrevive a las dos correcciones: persistencia entre años y comparaciones
    /// múltiples (q ≤ <see cref="GridTrendResultDto.FalseDiscoveryRate"/>).
    /// </summary>
    public bool IsSignificantCorrected { get; set; }

    /// <summary>Años que entraron en el análisis de la celda.</summary>
    public int Years { get; set; }
}
