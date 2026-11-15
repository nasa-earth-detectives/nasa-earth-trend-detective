using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Cleaning stage in DuckDB SQL on the canonical tuple:
/// 1) fill values, NaN/Infinity, and out-of-physical-range values => analytical NULL;
/// 2) linear temporal interpolation ONLY for single-period gaps (NULL row with immediate
///    valid neighbors in the same cell); gaps of 2 or more periods remain NULL.
/// Adds auxiliary columns is_valid and is_imputed for quality metrics.
/// </summary>
/// <remarks>
/// Multiple raw readings that fall into the same cell and timestamp (e.g. OCO-2 soundings) are averaged
/// before interpolating to ensure the time window is deterministic. The period of each cell is
/// its smallest step between consecutive timestamps; interpolation occurs only if valid neighbors are separated
/// by at most <see cref="MaxGapInPeriods"/> periods, so periods absent from the file also
/// count as gaps (e.g. January, February NULL, and December is not interpolated).
/// </remarks>
internal static class DataCleaningSql
{
    /// <summary>
    /// Maximum distance between valid neighbors, in periods (2 = a single missing period). The 0.5 margin
    /// absorbs calendar months from 28 to 31 days.
    /// </summary>
    public const double MaxGapInPeriods = 2.5;

    public static string Build(string canonicalSql, ResolvedCleaningRule rule)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(canonicalSql);
        ArgumentNullException.ThrowIfNull(rule);

        var invalidValue = InvalidCondition("value", rule.FillValues, rule.MinValidValue, rule.MaxValidValue);
        var invalidAnomaly = InvalidCondition("anomaly", rule.FillValues, null, null);
        var imputable = $"""
            clean_value IS NULL AND prev_value IS NOT NULL AND next_value IS NOT NULL AND next_ts > prev_ts
                AND epoch_ms(next_ts) - epoch_ms(prev_ts) <= {DuckDbSqlText.Number(MaxGapInPeriods)} * cell_step_ms
            """;

        return $"""
            WITH canonical AS (
            {canonicalSql}
            ),
            cleaned AS (
                SELECT variable_id, latitude, longitude, "timestamp",
                    CASE WHEN {invalidValue} THEN NULL ELSE value END AS clean_value,
                    CASE WHEN {invalidAnomaly} THEN NULL ELSE anomaly END AS anomaly
                FROM canonical
            ),
            per_cell AS (
                SELECT variable_id, latitude, longitude, "timestamp",
                    avg(clean_value) AS clean_value, avg(anomaly) AS anomaly
                FROM cleaned
                GROUP BY variable_id, latitude, longitude, "timestamp"
            ),
            neighbors AS (
                SELECT *,
                    lag(clean_value) OVER cell AS prev_value,
                    lag("timestamp") OVER cell AS prev_ts,
                    lead(clean_value) OVER cell AS next_value,
                    lead("timestamp") OVER cell AS next_ts,
                    epoch_ms("timestamp") - epoch_ms(lag("timestamp") OVER cell) AS step_ms
                FROM per_cell
                WINDOW cell AS (PARTITION BY variable_id, latitude, longitude ORDER BY "timestamp")
            ),
            stepped AS (
                SELECT *, min(step_ms) OVER (PARTITION BY variable_id, latitude, longitude) AS cell_step_ms
                FROM neighbors
            )
            SELECT variable_id, latitude, longitude, "timestamp",
                CASE
                    WHEN clean_value IS NOT NULL THEN clean_value
                    WHEN {imputable} THEN prev_value + (next_value - prev_value)
                        * CAST(epoch_ms("timestamp") - epoch_ms(prev_ts) AS DOUBLE)
                        / CAST(epoch_ms(next_ts) - epoch_ms(prev_ts) AS DOUBLE)
                END AS value,
                anomaly,
                clean_value IS NOT NULL AS is_valid,
                COALESCE({imputable}, false) AS is_imputed
            FROM stepped
            """;
    }

    private static string InvalidCondition(string column, IReadOnlyList<double> fills, double? min, double? max)
    {
        var conditions = new List<string> { $"{column} IS NULL", $"NOT isfinite({column})" };
        if (fills.Count > 0)
        {
            conditions.Add($"{column} IN ({string.Join(", ", fills.Select(DuckDbSqlText.Number))})");
        }

        if (min is { } lower)
        {
            conditions.Add($"{column} < {DuckDbSqlText.Number(lower)}");
        }

        if (max is { } upper)
        {
            conditions.Add($"{column} > {DuckDbSqlText.Number(upper)}");
        }

        return $"({string.Join(" OR ", conditions)})";
    }
}
