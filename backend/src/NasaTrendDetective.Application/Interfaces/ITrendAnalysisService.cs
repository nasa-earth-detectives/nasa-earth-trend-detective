using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

public interface ITrendAnalysisService
{
    Task<IEnumerable<TrendResultDto>> AnalyzeTrendsAsync(TrendQueryDto query);
    Task<IEnumerable<TrendObservation>> GetObservationsByYearAsync(ClimateVariable variable, int year);
}
