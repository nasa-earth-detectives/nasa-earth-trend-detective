using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Application.Statistics;

namespace NasaTrendDetective.Application.Implements;

public class GridTrendService : IGridTrendService
{
    /// <summary>
    /// Por debajo de ~10 años la aproximación normal de Mann-Kendall deja de ser fiable.
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

        var minPeriodsPerYear = VariableCadence.MinPeriodsPerYear(query.Variable);
        var series = await _gridRepository.GetCellAnnualSeriesAsync(
            query.Variable, query.StartYear, query.EndYear, minPeriodsPerYear, cancellationToken)
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
                    PrewhitenedPValue = verdict.Prewhitened.PValue,
                    Direction = verdict.Direction.ToString(),
                    Years = cell.Years.Count
                };
            })
            .ToList();

        // Con miles de celdas probadas a la vez, p < 0,05 deja pasar cientos por azar. Se ajusta sobre
        // los p del preblanqueo y no sobre los clásicos: el ajuste sólo vale si cada p es fiable, y el
        // clásico no lo es cuando la serie tiene persistencia.
        var adjusted = BenjaminiHochberg.Adjust(cells.Select(cell => cell.PrewhitenedPValue).ToList());
        for (var index = 0; index < cells.Count; index++)
        {
            cells[index].AdjustedPValue = adjusted[index];
            cells[index].IsSignificantCorrected = adjusted[index] <= BenjaminiHochberg.DefaultFalseDiscoveryRate;
        }

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
            MinMonthsPerYear = minPeriodsPerYear,
            MinYearsPerCell = MinYearsPerCell,
            FalseDiscoveryRate = BenjaminiHochberg.DefaultFalseDiscoveryRate,
            SignificantCells = cells.Count(cell => cell.IsSignificant),
            PrewhitenedSignificantCells = cells.Count(cell => cell.PrewhitenedPValue < 0.05),
            CorrectedSignificantCells = cells.Count(cell => cell.IsSignificantCorrected),
            Cells = cells
        };
    }
}
