using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

public class TrendAnalysisService : ITrendAnalysisService
{
    private readonly ITrendObservationRepository _repository;
    private readonly IDatasetCatalogRepository _catalog;

    public TrendAnalysisService(ITrendObservationRepository repository, IDatasetCatalogRepository catalog)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
    }

    public async Task<TrendResultDto> AnalyzeTrendsAsync(TrendQueryDto query, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        var observations = await _repository.GetAnnualSeriesAsync(
            query.Variable,
            query.StartYear,
            query.EndYear,
            query.Latitude,
            query.Longitude,
            toleranceDegrees: 1.0,
            cancellationToken).ConfigureAwait(false);

        // Solo una variable sin dataset recibe la serie de demostración. Con dataset cargado, una
        // celda sin datos devuelve una serie vacía: inventarla ahí haría pasar ficción por observación.
        var observed = observations.Count > 0
            || await IsObservedAsync(query.Variable, cancellationToken).ConfigureAwait(false);
        if (!observed)
        {
            observations = SyntheticClimateData.AnnualSeries(
                query.Variable, query.StartYear, query.EndYear, query.Latitude ?? 0, query.Longitude ?? 0);
        }

        var verdict = TrendStatisticsEngine.Analyze(observations);

        return new TrendResultDto
        {
            Variable = query.Variable,
            Latitude = query.Latitude ?? 0.0,
            Longitude = query.Longitude ?? 0.0,
            StartYear = query.StartYear,
            EndYear = query.EndYear,
            SensSlope = verdict.SensSlope,
            SensSlopePerDecade = verdict.SensSlopePerDecade,
            MannKendallZ = verdict.ZScore,
            SStatistic = verdict.SStatistic,
            VarianceS = verdict.VarianceS,
            PValue = verdict.PValue,
            IsSignificant = verdict.IsSignificant,
            Direction = verdict.Direction.ToString(),
            ConfidenceInterval95 = verdict.ConfidenceInterval95,
            Observations = observations,
            Source = observed ? DatasetStatusDto.Observed : DatasetStatusDto.Synthetic
        };
    }

    public Task<TrendResultDto> AnalyzeCustomSeriesAsync(AnalyzeSeriesRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var verdict = TrendStatisticsEngine.Analyze(request.Observations);
        var startYear = request.Observations.Min(o => o.Year);
        var endYear = request.Observations.Max(o => o.Year);

        var result = new TrendResultDto
        {
            Variable = request.Variable,
            Latitude = request.Latitude ?? 0.0,
            Longitude = request.Longitude ?? 0.0,
            StartYear = startYear,
            EndYear = endYear,
            SensSlope = verdict.SensSlope,
            SensSlopePerDecade = verdict.SensSlopePerDecade,
            MannKendallZ = verdict.ZScore,
            SStatistic = verdict.SStatistic,
            VarianceS = verdict.VarianceS,
            PValue = verdict.PValue,
            IsSignificant = verdict.IsSignificant,
            Direction = verdict.Direction.ToString(),
            ConfidenceInterval95 = verdict.ConfidenceInterval95,
            Observations = request.Observations
        };

        return Task.FromResult(result);
    }

    public async Task<IEnumerable<TrendObservation>> GetObservationsByYearAsync(
        ClimateVariable variable,
        int year,
        CancellationToken cancellationToken = default)
    {
        var observations = await _repository.GetObservationsByYearAsync(variable, year, cancellationToken)
            .ConfigureAwait(false);
        if (observations.Count > 0 || await IsObservedAsync(variable, cancellationToken).ConfigureAwait(false))
        {
            return observations;
        }

        return SyntheticClimateData.GridSnapshot(variable, year);
    }

    private async Task<bool> IsObservedAsync(ClimateVariable variable, CancellationToken cancellationToken) =>
        await _catalog.GetAsync(variable, cancellationToken).ConfigureAwait(false) is not null;
}
