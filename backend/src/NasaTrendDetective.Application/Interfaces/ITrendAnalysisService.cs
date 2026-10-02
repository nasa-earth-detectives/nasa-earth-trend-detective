using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

public interface ITrendAnalysisService
{
    Task<TrendResultDto> AnalyzeTrendsAsync(TrendQueryDto query, CancellationToken cancellationToken = default);
    Task<TrendResultDto> AnalyzeCustomSeriesAsync(AnalyzeSeriesRequestDto request, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrendObservation>> GetObservationsByYearAsync(ClimateVariable variable, int year, CancellationToken cancellationToken = default);
}
