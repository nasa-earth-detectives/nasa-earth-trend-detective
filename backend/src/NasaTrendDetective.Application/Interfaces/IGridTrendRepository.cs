using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Series anuales por celda de la grilla, solo con datos observados (sin relleno sintético).
/// </summary>
public interface IGridTrendRepository
{
    /// <param name="minMonthsPerYear">
    /// Un año entra en la serie de una celda solo si tiene al menos estos meses válidos; así un año
    /// en curso (p.ej. enero-agosto) no se compara de igual a igual con años completos.
    /// </param>
    Task<IReadOnlyList<CellAnnualSeries>> GetCellAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        int minMonthsPerYear,
        CancellationToken cancellationToken = default);
}
