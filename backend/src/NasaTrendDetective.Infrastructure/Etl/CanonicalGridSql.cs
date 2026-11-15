using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Generates DuckDB SQL transforming raw columns into canonical WGS84 tuples:
/// latitude validated in [-90, 90], raw longitude accepted in [-180, 360] and wrapped to [-180, 180),
/// both rounded to 2 decimals (DECIMAL(5,2)) so cells from different missions align.
/// Value and anomaly are exposed typed without filtering: the <see cref="DataCleaningSql"/> stage
/// converts invalid entries into analytical NULLs and imputes them, rather than dropping the row.
/// </summary>
internal static class CanonicalGridSql
{
    public const int CoordinateDecimals = 2;

    public static string Build(string rawSelectSql, byte variableId, GridColumnMapping mapping)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawSelectSql);
        ArgumentNullException.ThrowIfNull(mapping);

        var time = string.IsNullOrWhiteSpace(mapping.TimeFormat)
            ? "TRY_CAST(raw_time AS TIMESTAMP)"
            : $"TRY_STRPTIME(raw_time, {DuckDbSqlText.Literal(mapping.TimeFormat)})";

        // Double modulo: in DuckDB '%' preserves the sign of the dividend (fmod), so 360 is added
        // before the second modulo. Rounding before and after prevents binary residue
        // (359.99 - 360 = -0.0100000000000193) and the final CASE handles the boundary 179.995 -> 180.00.
        return $"""
            WITH src AS (
            {rawSelectSql}
            ),
            typed AS (
                SELECT
                    TRY_CAST(raw_latitude AS DOUBLE) AS lat,
                    TRY_CAST(raw_longitude AS DOUBLE) AS lon,
                    {time} AS ts,
                    TRY_CAST(raw_value AS DOUBLE) AS val,
                    TRY_CAST(raw_anomaly AS DOUBLE) AS anom
                FROM src
            ),
            valid AS (
                SELECT * FROM typed
                WHERE lat IS NOT NULL AND lon IS NOT NULL AND ts IS NOT NULL
                  AND isfinite(lat) AND isfinite(lon)
                  AND lat BETWEEN -90 AND 90
                  AND lon BETWEEN -180 AND 360
            ),
            wrapped AS (
                SELECT
                    round(lat, {CoordinateDecimals}) AS lat2,
                    round(((round(lon, {CoordinateDecimals}) + 180) % 360 + 360) % 360 - 180,
                          {CoordinateDecimals}) AS lon2,
                    ts, val, anom
                FROM valid
            )
            SELECT
                CAST({variableId} AS TINYINT) AS variable_id,
                CAST(lat2 AS DECIMAL(5,2)) AS latitude,
                CAST(CASE WHEN lon2 >= 180 THEN lon2 - 360 ELSE lon2 END AS DECIMAL(5,2)) AS longitude,
                CAST(ts AS TIMESTAMP) AS "timestamp",
                val AS value,
                anom AS anomaly
            FROM wrapped
            """;
    }

    /// <summary>
    /// Exports the cleaned table to SNAPPY-compressed Parquet with canonical tuples, sorted for data skipping.
    /// </summary>
    public static string BuildCopy(string cleanTable, string outputPath) =>
        $"""
        COPY (
            SELECT variable_id, latitude, longitude, "timestamp", value, anomaly
            FROM {DuckDbSqlText.Identifier(cleanTable)}
            ORDER BY variable_id, "timestamp", latitude, longitude
        ) TO {DuckDbSqlText.Literal(outputPath)} (FORMAT PARQUET, COMPRESSION SNAPPY)
        """;
}
