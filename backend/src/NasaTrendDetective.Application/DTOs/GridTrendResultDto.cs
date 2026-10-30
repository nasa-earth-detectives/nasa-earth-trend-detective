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

    /// <summary>Reglas de inclusión aplicadas, para que el cliente pueda explicarlas.</summary>
    public int MinMonthsPerYear { get; set; }
    public int MinYearsPerCell { get; set; }

    public IReadOnlyList<GridTrendCellDto> Cells { get; set; } = Array.Empty<GridTrendCellDto>();
}
