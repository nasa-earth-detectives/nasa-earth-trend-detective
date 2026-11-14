using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Application.Statistics;

namespace NasaTrendDetective.Application.Implements;

public class GridTrendService : IGridTrendService
{
    /// <summary>
    /// 9 out of 12 months (75%): excludes an incomplete current year without discarding polar cells
    /// that might have a missing month. This is a project heuristic, not a cited standard.
    /// </summary>
    public const int MinMonthsPerYear = 9;

    /// <summary>
    /// Below ~10 years the normal approximation of Mann-Kendall loses reliability.
    /// </summary>
    public const int MinYearsPerCell = 10;

    private readonly IGridTrendRepository _gridRepository;
    private readonly IDatasetCatalogRepository _catalog;

    public GridTrendService(IGridTrendRepository gridRepository, IDatasetCatalogRepository catalog)
    {
        _gridRepository = gridRepository ?? throw new ArgumentNullException(nameof(gridRepository));
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
    }

    public async Task<GridTrendResultDto?> AnalyzeGridAsync(
        GridTrendQueryDto query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        var provenance = await _catalog.GetAsync(query.Variable, cancellationToken).ConfigureAwait(false);
        if (provenance is null)
        {
            return null;
        }

        var series = await _gridRepository.GetCellAnnualSeriesAsync(
            query.Variable, query.StartYear, query.EndYear, MinMonthsPerYear, cancellationToken)
            .ConfigureAwait(false);

        var cells = series
            .Where(cell => cell.Years.Count >= MinYearsPerCell)
            .Select(cell =>
            {
                var verdict = TrendStatisticsEngine.Analyze(cell.Years);
                return new GridTrendCellDto
                {
                    Latitude = cell.Latitude,
                    Longitude = cell.Longitude,
                    SensSlope = verdict.SensSlope,
                    SensSlopePerDecade = verdict.SensSlopePerDecade,
                    MannKendallZ = verdict.ZScore,
                    PValue = verdict.PValue,
                    IsSignificant = verdict.IsSignificant,
                    Direction = verdict.Direction.ToString(),
                    Years = cell.Years.Count
                };
            })
            .ToList();

        return new GridTrendResultDto
        {
            Variable = query.Variable,
            StartYear = query.StartYear,
            EndYear = query.EndYear,
            Unit = provenance.TrendUnit,
            ResolutionDegrees = provenance.ResolutionDegrees,
            Provider = provenance.Provider,
            Product = provenance.Product,
            Interim = provenance.Interim,
            MinMonthsPerYear = MinMonthsPerYear,
            MinYearsPerCell = MinYearsPerCell,
            Cells = cells
        };
    }
}
