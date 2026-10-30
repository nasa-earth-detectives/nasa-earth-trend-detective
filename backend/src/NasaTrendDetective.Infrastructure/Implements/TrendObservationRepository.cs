using System.Data;
using System.Globalization;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Lecturas de observaciones reales en DuckDB. No rellena con datos sintéticos: si no hay filas
/// devuelve una lista vacía y es el servicio, que conoce el catálogo, quien decide qué mostrar.
/// </summary>
public class TrendObservationRepository : ITrendObservationRepository
{
    /// <summary>Misma regla que el análisis por celda: un año incompleto no entra en la serie.</summary>
    private const int MinMonthsPerYear = GridTrendService.MinMonthsPerYear;

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
        CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object?>
        {
            ["varId"] = (byte)variable,
            ["startYear"] = startYear,
            ["endYear"] = endYear,
            ["minMonths"] = MinMonthsPerYear
        };

        var where = "WHERE variable_id = $varId AND year BETWEEN $startYear AND $endYear";
        if (latitude.HasValue && longitude.HasValue)
        {
            where += " AND latitude BETWEEN $minLat AND $maxLat AND longitude BETWEEN $minLng AND $maxLng";
            parameters["minLat"] = latitude.Value - toleranceDegrees;
            parameters["maxLat"] = latitude.Value + toleranceDegrees;
            parameters["minLng"] = longitude.Value - toleranceDegrees;
            parameters["maxLng"] = longitude.Value + toleranceDegrees;
        }

        // count(DISTINCT month): la ventana puede abarcar varias celdas, y lo que importa es cuántos
        // meses del año están representados, no cuántas filas hay.
        var sql = $"""
            SELECT
                CAST(year AS INTEGER) AS obs_year,
                avg(observation_value) AS avg_val,
                avg(anomaly_value) AS avg_anom
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

        // Una fila por celda (media de los meses disponibles). Antes se devolvía una fila por mes con
        // LIMIT 5000: la misma celda aparecía hasta 12 veces y la grilla quedaba recortada al azar.
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
            // Determinista y único por celda: el frontend rechaza identificadores repetidos.
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
