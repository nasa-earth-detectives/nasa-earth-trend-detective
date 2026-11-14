using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Tendencia por celda de toda la grilla observada para un periodo. Solo existe con datos reales:
/// sin dataset cargado la API responde 404 en lugar de inventar una grilla.
/// </summary>
public class GridTrendResultDto
{
    public ClimateVariable Variable { get; set; }
    public int StartYear { get; set; }
    public int EndYear { get; set; }

    /// <summary>Unidad de <see cref="GridTrendCellDto.SensSlope"/> (p.ej. "°C / año").</summary>
    public string Unit { get; set; } = string.Empty;

    public double ResolutionDegrees { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public bool Interim { get; set; }

    /// <summary>
    /// Reglas de inclusión aplicadas, para que el cliente pueda explicarlas. En un dataset mensual
    /// son meses por año (9); en uno anual, como MERRA-2, es 1: el año ya llega completo.
    /// </summary>
    public int MinMonthsPerYear { get; set; }
    public int MinYearsPerCell { get; set; }

    /// <summary>Tasa de falsos descubrimientos tolerada al marcar una celda como corregida.</summary>
    public double FalseDiscoveryRate { get; set; }

    /// <summary>Celdas con p &lt; 0,05 en el Mann-Kendall clásico, sin ninguna corrección.</summary>
    public int SignificantCells { get; set; }

    /// <summary>Celdas que siguen con p &lt; 0,05 al descontar la persistencia entre años.</summary>
    public int PrewhitenedSignificantCells { get; set; }

    /// <summary>Celdas que superan además el control de comparaciones múltiples.</summary>
    public int CorrectedSignificantCells { get; set; }

    public IReadOnlyList<GridTrendCellDto> Cells { get; set; } = Array.Empty<GridTrendCellDto>();
}
