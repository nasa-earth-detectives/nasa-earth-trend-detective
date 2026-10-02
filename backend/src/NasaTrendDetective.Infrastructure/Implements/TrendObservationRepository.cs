using System.Data;
using System.Globalization;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

public class TrendObservationRepository : ITrendObservationRepository
{
    private readonly IDuckDbRepository _repository;

    public TrendObservationRepository(IDuckDbRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<IReadOnlyList<AnnualObservation>> GetAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        double? latitude = null,
        double? longitude = null,
        double toleranceDegrees = 1.0,
        CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object?>
        {
            ["varId"] = (byte)variable,
            ["startYear"] = startYear,
            ["endYear"] = endYear
        };

        string whereClause;
        if (latitude.HasValue && longitude.HasValue)
        {
            whereClause = "WHERE variable_id = $varId AND year BETWEEN $startYear AND $endYear " +
                          "AND latitude BETWEEN $minLat AND $maxLat AND longitude BETWEEN $minLng AND $maxLng";
            parameters["minLat"] = latitude.Value - toleranceDegrees;
            parameters["maxLat"] = latitude.Value + toleranceDegrees;
            parameters["minLng"] = longitude.Value - toleranceDegrees;
            parameters["maxLng"] = longitude.Value + toleranceDegrees;
        }
        else
        {
            whereClause = "WHERE variable_id = $varId AND year BETWEEN $startYear AND $endYear";
        }

        var sql = $@"
            SELECT 
                CAST(year AS INTEGER) AS obs_year,
                avg(observation_value) AS avg_val,
                avg(anomaly_value) AS avg_anom
            FROM fact_climate_observations
            {whereClause}
            GROUP BY year
            ORDER BY year;";

        var dbResults = await _repository.QueryAsync(sql, MapAnnualRecord, parameters, cancellationToken)
            .ConfigureAwait(false);

        if (dbResults.Count > 0)
        {
            return dbResults;
        }

        // Fallback demostrativo determinista si la BD aún no tiene Parquets cargados para la celda
        return GenerateDeterministicSeries(variable, startYear, endYear, latitude ?? 0, longitude ?? 0);
    }

    public async Task<IReadOnlyList<TrendObservation>> GetObservationsByYearAsync(
        ClimateVariable variable,
        int year,
        CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object?>
        {
            ["varId"] = (byte)variable,
            ["year"] = year
        };

        var sql = @"
            SELECT 
                CAST(observation_id AS VARCHAR) AS obs_id,
                CAST(latitude AS DOUBLE) AS lat,
                CAST(longitude AS DOUBLE) AS lng,
                observation_value,
                anomaly_value
            FROM fact_climate_observations
            WHERE variable_id = $varId AND year = $year
            LIMIT 5000;";

        var dbResults = await _repository.QueryAsync(sql, r => MapObservationRecord(r, variable, year), parameters, cancellationToken)
            .ConfigureAwait(false);

        if (dbResults.Count > 0)
        {
            return dbResults;
        }

        return GenerateFallbackGridObservations(variable, year);
    }

    private static AnnualObservation MapAnnualRecord(IDataRecord record) =>
        new(
            record.GetInt32(0),
            record.IsDBNull(1) ? 0.0 : record.GetDouble(1),
            record.IsDBNull(2) ? null : record.GetDouble(2));

    private static TrendObservation MapObservationRecord(IDataRecord record, ClimateVariable variable, int year) =>
        new()
        {
            Id = record.GetString(0),
            Variable = variable,
            Latitude = record.GetDouble(1),
            Longitude = record.GetDouble(2),
            Value = record.IsDBNull(3) ? 0.0 : record.GetDouble(3),
            Anomaly = record.IsDBNull(4) ? null : record.GetDouble(4),
            Unit = variable switch
            {
                ClimateVariable.Gistemp => "°C Anomaly",
                ClimateVariable.ModisNdvi => "NDVI",
                ClimateVariable.GraceMass => "cm EWH",
                _ => "ppm"
            },
            Timestamp = new DateTime(year, 6, 15, 0, 0, 0, DateTimeKind.Utc)
        };

    private static IReadOnlyList<AnnualObservation> GenerateDeterministicSeries(
        ClimateVariable variable, int startYear, int endYear, double lat, double lng)
    {
        var count = Math.Max(1, endYear - startYear + 1);
        var list = new List<AnnualObservation>(count);
        var baseSeed = (int)Math.Abs(lat * 100 + lng * 10 + (int)variable);
        var isArctic = lat > 66.0;

        for (var y = startYear; y <= endYear; y++)
        {
            var t = y - startYear;
            double slope = variable switch
            {
                ClimateVariable.Gistemp => isArctic ? 0.070 : 0.024,
                ClimateVariable.ModisNdvi => 0.0018,
                ClimateVariable.GraceMass => isArctic ? -220.0 : -15.0,
                _ => 2.45 // Oco2 ppm/yr
            };

            var noise = (Math.Sin(baseSeed + t * 1.5) * 0.15) * Math.Abs(slope);
            var val = (t * slope) + noise;
            list.Add(new AnnualObservation(y, Math.Round(val, 4), Math.Round(val, 4)));
        }

        return list;
    }

    private static IReadOnlyList<TrendObservation> GenerateFallbackGridObservations(ClimateVariable variable, int year)
    {
        var points = new[]
        {
            (78.22, 15.63, 0.85, 1.42),   // Ártico
            (55.0, -30.0, -0.22, -0.45),  // Atlántico Norte
            (-3.46, -62.21, 0.72, -0.08), // Amazonía
            (25.0, 115.0, 0.65, 0.12),    // Sur de China
            (72.0, -40.0, -180.0, -210.0),// Groenlandia
            (4.71, -74.07, 1.10, 0.40)    // Bogotá
        };

        return points.Select((p, idx) => new TrendObservation
        {
            Id = $"fb-{year}-{idx}",
            Variable = variable,
            Latitude = p.Item1,
            Longitude = p.Item2,
            Value = p.Item3,
            Anomaly = p.Item4,
            Unit = variable switch
            {
                ClimateVariable.Gistemp => "°C Anomaly",
                ClimateVariable.ModisNdvi => "NDVI",
                ClimateVariable.GraceMass => "cm EWH",
                _ => "ppm"
            },
            Timestamp = new DateTime(year, 6, 15, 0, 0, 0, DateTimeKind.Utc)
        }).ToList();
    }
}
