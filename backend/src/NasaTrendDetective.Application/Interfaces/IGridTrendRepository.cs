using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Annual time series per grid cell, sourced exclusively from observed data (without synthetic filling).
/// </summary>
public interface IGridTrendRepository
{
    /// <param name="minMonthsPerYear">
    /// A year is included in a cell's series only if it contains at least this many valid months; this prevents
    /// an incomplete current year (e.g. Jan-Aug) from being evaluated against full years.
    /// </param>
    Task<IReadOnlyList<CellAnnualSeries>> GetCellAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        int minMonthsPerYear,
        CancellationToken cancellationToken = default);
}
