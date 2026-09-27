using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Genera el SQL DuckDB que transforma las columnas crudas en tuplas canónicas WGS84:
/// latitud validada en [-90, 90], longitud cruda aceptada en [-180, 360] y llevada a [-180, 180),
/// ambas redondeadas a 2 decimales (DECIMAL(5,2)) para que celdas de misiones distintas coincidan.
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
        var missing = mapping.MissingValue is { } fill
            ? $"AND val <> {DuckDbSqlText.Number(fill)}"
            : string.Empty;

        // Doble módulo: en DuckDB '%' conserva el signo del dividendo (fmod), así que se suma 360
        // antes del segundo módulo. Se redondea antes y después para evitar residuos binarios
        // (359.99 - 360 = -0.0100000000000193) y el CASE final cubre el borde 179.995 -> 180.00.
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
                WHERE lat IS NOT NULL AND lon IS NOT NULL AND ts IS NOT NULL AND val IS NOT NULL
                  AND isfinite(lat) AND isfinite(lon) AND isfinite(val)
                  AND lat BETWEEN -90 AND 90
                  AND lon BETWEEN -180 AND 360
                  {missing}
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
                CASE WHEN isfinite(anom) THEN anom END AS anomaly
            FROM wrapped
            ORDER BY variable_id, "timestamp", latitude, longitude
            """;
    }

    public static string BuildCopy(string canonicalSql, string outputPath) =>
        $"COPY ({canonicalSql}) TO {DuckDbSqlText.Literal(outputPath)} (FORMAT PARQUET, COMPRESSION SNAPPY)";
}
