using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Annual series per grid cell, with observed data only (no synthetic padding).
/// </summary>
public interface IGridTrendRepository
{
    /// <param name="minMonthsPerYear">
    /// A year enters a cell's series only if it has at least this many valid periods; this way a year
    /// in progress (e.g., January-August) is not compared on equal terms with complete years. Decided by
    /// VariableCadence: 9 months in monthly datasets, 1 row in annual datasets.
    /// </param>
    Task<IReadOnlyList<CellAnnualSeries>> GetCellAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        int minMonthsPerYear,
        CancellationToken cancellationToken = default);
}
