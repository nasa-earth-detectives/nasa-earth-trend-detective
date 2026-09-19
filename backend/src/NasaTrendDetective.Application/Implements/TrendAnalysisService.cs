using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

public class TrendAnalysisService : ITrendAnalysisService
{
    public Task<IEnumerable<TrendResultDto>> AnalyzeTrendsAsync(TrendQueryDto query)
    {
        // Cálculo demostrativo / baseline para Johan Olaya y equipo
        var results = new List<TrendResultDto>
        {
            new TrendResultDto
            {
                Variable = query.Variable,
                Latitude = query.Latitude ?? 4.7110, // Bogotá referencia
                Longitude = query.Longitude ?? -74.0721,
                StartYear = query.StartYear,
                EndYear = query.EndYear,
                SensSlope = 0.28, // +0.28°C por década
                MannKendallZ = 2.45, // |Z| > 1.96 => p < 0.05
                PValue = 0.014,
                IsSignificant = true,
                Direction = "Increasing"
            }
        };

        return Task.FromResult<IEnumerable<TrendResultDto>>(results);
    }

    public Task<IEnumerable<TrendObservation>> GetObservationsByYearAsync(ClimateVariable variable, int year)
    {
        var sampleData = new List<TrendObservation>
        {
            new TrendObservation
            {
                Variable = variable,
                Latitude = 0.0,
                Longitude = -70.0, // Amazonía
                Value = 0.82,
                Unit = "NDVI",
                Anomaly = -0.04,
                Timestamp = new DateTime(year, 6, 15, 0, 0, 0, DateTimeKind.Utc)
            },
            new TrendObservation
            {
                Variable = variable,
                Latitude = 45.0,
                Longitude = 10.0, // Europa
                Value = 1.15,
                Unit = "°C Anomaly",
                Anomaly = 0.65,
                Timestamp = new DateTime(year, 6, 15, 0, 0, 0, DateTimeKind.Utc)
            }
        };

        return Task.FromResult<IEnumerable<TrendObservation>>(sampleData);
    }
}
