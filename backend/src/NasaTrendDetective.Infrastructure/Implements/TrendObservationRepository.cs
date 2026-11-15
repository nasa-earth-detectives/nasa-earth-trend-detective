using System.Data;
using System.Globalization;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Reads real observations from DuckDB. Does not pad with synthetic data: if there are no rows
/// it returns an empty list, and the service—which knows the catalog—decides what to show.
/// </summary>
public class TrendObservationRepository : ITrendObservationRepository
{
    private readonly IDuckDbRepository _repository;

    public TrendObservationRepository(IDuckDbRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public Task<IReadOnlyList<AnnualObservation>> GetAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        double? latitude = null,
        double? longitude = null,
        double toleranceDegrees = 1.0,
        double? longitudeToleranceDegrees = null,
        CancellationToken cancellationToken = default)
    {
        var longitudeTolerance = longitudeToleranceDegrees ?? toleranceDegrees;
        // A box larger than the 2° around a point is a region: its cells are weighted by area (cosine of
        // the latitude), or the cells near the poles, which are smaller, would count as much as the rest.
        // The point window keeps the plain mean it always had, so its published figures do not move.
        var regional = latitude.HasValue && longitude.HasValue && (toleranceDegrees > 1.0 || longitudeTolerance > 1.0);
        const string Weight = "cos(radians(CAST(latitude AS DOUBLE)))";
        string Mean(string column) => regional
            ? $"sum({column} * {Weight}) / NULLIF(sum(CASE WHEN {column} IS NOT NULL THEN {Weight} END), 0)"
            : $"avg({column})";
        var parameters = new Dictionary<string, object?>
        {
            ["varId"] = (byte)variable,
            ["startYear"] = startYear,
            ["endYear"] = endYear,
            // Same rule as per-cell analysis: an incomplete year does not enter the series.
            ["minMonths"] = VariableCadence.MinPeriodsPerYear(variable)
        };

        var where = "WHERE variable_id = $varId AND year BETWEEN $startYear AND $endYear";
        if (latitude.HasValue && longitude.HasValue)
        {
            where += " AND latitude BETWEEN $minLat AND $maxLat AND longitude BETWEEN $minLng AND $maxLng";
            parameters["minLat"] = latitude.Value - toleranceDegrees;
            parameters["maxLat"] = latitude.Value + toleranceDegrees;
            parameters["minLng"] = longitude.Value - longitudeTolerance;
            parameters["maxLng"] = longitude.Value + longitudeTolerance;
        }

        // count(DISTINCT month): the window may span multiple cells, and what matters is how many
        // months of the year are represented, not how many rows exist.
        var sql = $"""
            SELECT
                CAST(year AS INTEGER) AS obs_year,
                {Mean("observation_value")} AS avg_val,
                {Mean("anomaly_value")} AS avg_anom
            FROM fact_climate_observations
            {where}
              AND COALESCE(anomaly_value, observation_value) IS NOT NULL
            GROUP BY year
            HAVING count(DISTINCT month) >= $minMonths
            ORDER BY year
            """;

        return _repository.QueryAsync(sql, MapAnnualRecord, parameters, cancellationToken);
    }

    public Task<IReadOnlyList<TrendObservation>> GetObservationsByYearAsync(
        ClimateVariable variable,
        int year,
        CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object?>
        {
            ["varId"] = (byte)variable,
            ["year"] = year
        };

        // One row per cell (mean of available months). Previously one row per month was returned with
        // LIMIT 5000: the same cell appeared up to 12 times and the grid was arbitrarily truncated.
        const string sql = """
            SELECT
                CAST(latitude AS DOUBLE) AS lat,
                CAST(longitude AS DOUBLE) AS lng,
                avg(observation_value) AS avg_val,
                avg(anomaly_value) AS avg_anom
            FROM fact_climate_observations
            WHERE variable_id = $varId AND year = $year
            GROUP BY latitude, longitude
            HAVING avg(COALESCE(anomaly_value, observation_value)) IS NOT NULL
            ORDER BY latitude, longitude
            """;

        return _repository.QueryAsync(
            sql, record => MapObservationRecord(record, variable, year), parameters, cancellationToken);
    }

    private static AnnualObservation MapAnnualRecord(IDataRecord record) =>
        new(
            record.GetInt32(0),
            record.IsDBNull(1) ? 0.0 : record.GetDouble(1),
            record.IsDBNull(2) ? null : record.GetDouble(2));

    private static TrendObservation MapObservationRecord(IDataRecord record, ClimateVariable variable, int year)
    {
        var latitude = record.GetDouble(0);
        var longitude = record.GetDouble(1);
        var anomaly = record.IsDBNull(3) ? (double?)null : record.GetDouble(3);
        return new TrendObservation
        {
            // Deterministic and unique per cell: the frontend rejects duplicate identifiers.
            Id = string.Create(CultureInfo.InvariantCulture, $"{variable}:{year}:{latitude:F3}:{longitude:F3}"),
            Variable = variable,
            Latitude = latitude,
            Longitude = longitude,
            Value = record.IsDBNull(2) ? anomaly ?? 0.0 : record.GetDouble(2),
            Anomaly = anomaly,
            Unit = VariableUnits.For(variable),
            Timestamp = new DateTime(year, 6, 15, 0, 0, 0, DateTimeKind.Utc)
        };
    }
}
