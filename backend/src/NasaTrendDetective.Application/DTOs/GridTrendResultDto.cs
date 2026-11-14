using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Per-cell trend across the entire observed grid for a period. Only exists with real data:
/// without a loaded dataset, the API responds with 404 instead of inventing a grid.
/// </summary>
public class GridTrendResultDto
{
    public ClimateVariable Variable { get; set; }
    public int StartYear { get; set; }
    public int EndYear { get; set; }

    /// <summary>Unit of <see cref="GridTrendCellDto.SensSlope"/> (e.g. "°C / year").</summary>
    public string Unit { get; set; } = string.Empty;

    public double ResolutionDegrees { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public bool Interim { get; set; }

    /// <summary>
    /// Applied inclusion rules, so the client can explain them. In a monthly dataset this is
    /// months per year (9); in an annual one, such as MERRA-2, it is 1: the year already arrives complete.
    /// </summary>
    public int MinMonthsPerYear { get; set; }
    public int MinYearsPerCell { get; set; }

    public IReadOnlyList<GridTrendCellDto> Cells { get; set; } = Array.Empty<GridTrendCellDto>();
}
