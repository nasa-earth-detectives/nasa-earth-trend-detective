using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Application.Interfaces;

public interface IGridTrendService
{
    /// <summary>
    /// Mann-Kendall / Sen en cada celda observada. Devuelve null si la variable no tiene un dataset
    /// real cargado: no se fabrica una grilla sintética.
    /// </summary>
    Task<GridTrendResultDto?> AnalyzeGridAsync(GridTrendQueryDto query, CancellationToken cancellationToken = default);
}
