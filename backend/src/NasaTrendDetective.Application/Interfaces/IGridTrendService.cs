using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Application.Interfaces;

public interface IGridTrendService
{
    /// <summary>
    /// Mann-Kendall / Sen on each observed cell. Returns null if the variable has no
    /// real loaded dataset: a synthetic grid is not fabricated.
    /// </summary>
    Task<GridTrendResultDto?> AnalyzeGridAsync(GridTrendQueryDto query, CancellationToken cancellationToken = default);
}
