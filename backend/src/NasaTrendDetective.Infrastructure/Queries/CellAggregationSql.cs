using System.Data;
using System.Globalization;
using NasaTrendDetective.Infrastructure.Queries.Models;

namespace NasaTrendDetective.Infrastructure.Queries;

/// <summary>
/// Consulta de agregación global por celda espacial sobre fact_climate_observations: promedio por
/// variable y año con lat/lng redondeados. Los filtros se enlazan como parámetros ($variable, $from,
/// $to); los decimales de celda se validan e interpolan como entero.
/// </summary>
internal static class CellAggregationSql
{
    public static (string Sql, IReadOnlyDictionary<string, object?> Parameters) Build(CellAggregationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentOutOfRangeException.ThrowIfNegative(request.CellDecimals);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(request.CellDecimals, CellAggregationRequest.MaxCellDecimals);

        var filters = new List<string>();
        var parameters = new Dictionary<string, object?>();
        if (request.VariableId is { } variable)
        {
            filters.Add("variable_id = $variable");
            parameters["variable"] = (int)variable;
        }

        if (request.FromYear is { } from)
        {
            filters.Add("year >= $from");
            parameters["from"] = from;
        }

        if (request.ToYear is { } to)
        {
            filters.Add("year <= $to");
            parameters["to"] = to;
        }

        var where = filters.Count == 0 ? string.Empty : "WHERE " + string.Join(" AND ", filters);
        var decimals = request.CellDecimals.ToString(CultureInfo.InvariantCulture);
        var sql = $"""
            SELECT
                CAST(variable_id AS TINYINT) AS variable_id,
                CAST(year AS INTEGER) AS year,
                round(CAST(latitude AS DOUBLE), {decimals}) AS cell_latitude,
                round(CAST(longitude AS DOUBLE), {decimals}) AS cell_longitude,
                avg(observation_value) AS average_value,
                avg(anomaly_value) AS average_anomaly,
                count(*) AS observation_count,
                count(observation_value) AS valid_observation_count
            FROM fact_climate_observations
            {where}
            GROUP BY 1, 2, 3, 4
            ORDER BY 1, 2, 3, 4
            """;
        return (sql, parameters);
    }

    public static CellAggregate Map(IDataRecord record) =>
        new(
            Convert.ToByte(record.GetValue(0), CultureInfo.InvariantCulture),
            record.GetInt32(1),
            record.GetDouble(2),
            record.GetDouble(3),
            record.IsDBNull(4) ? null : record.GetDouble(4),
            record.IsDBNull(5) ? null : record.GetDouble(5),
            Convert.ToInt64(record.GetValue(6), CultureInfo.InvariantCulture),
            Convert.ToInt64(record.GetValue(7), CultureInfo.InvariantCulture));
}
