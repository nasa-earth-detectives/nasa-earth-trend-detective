namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Native DuckDB importer SQL: executes fully inside the engine (INSERT ... SELECT FROM read_parquet),
/// without deserializing rows into .NET.
/// </summary>
internal static class ParquetImportSql
{
    public const string FactTable = "fact_climate_observations";

    public const string MaxObservationId =
        $"SELECT COALESCE(max(observation_id), 0) FROM {FactTable}";

    public static string CountFiles(string glob) =>
        $"SELECT count(*) FROM glob({DuckDbSqlText.Literal(glob)})";

    public static string Describe(string glob) =>
        $"DESCRIBE SELECT * FROM read_parquet({DuckDbSqlText.Literal(glob)})";

    public static string CountRows(string glob) =>
        $"SELECT count(*) FROM read_parquet({DuckDbSqlText.Literal(glob)})";

    public static string HasExistingVariables(string glob) =>
        $"""
        SELECT CASE WHEN EXISTS (
            SELECT 1 FROM {FactTable} f
            WHERE f.variable_id IN (
                SELECT DISTINCT CAST(variable_id AS TINYINT)
                FROM read_parquet({DuckDbSqlText.Literal(glob)})
                WHERE variable_id IS NOT NULL
            )
        ) THEN 1 ELSE 0 END
        """;

    /// <summary>
    /// Inserts new facts: year/month are extracted from timestamp, NaN/Infinity become NULL (cleaned NULLs
    /// are preserved without re-imputing), multiple rows for the same month and cell are consolidated using avg,
    /// previously loaded cells/months are skipped when overlapping variables already exist, and observation_id is
    /// deterministic: previous max + row_number() ordered by (variable_id, year, latitude, longitude, month).
    /// </summary>
    public static string InsertFacts(string glob, long previousMaxId, bool checkDuplicates = true)
    {
        var literal = DuckDbSqlText.Literal(glob);
        var freshCte = checkDuplicates
            ? $"""
              ,
              fresh AS (
                  SELECT c.* FROM cells c
                  ANTI JOIN (
                      SELECT variable_id, latitude, longitude, year, month
                      FROM {FactTable}
                      WHERE variable_id IN (
                          SELECT DISTINCT CAST(variable_id AS TINYINT)
                          FROM read_parquet({literal})
                          WHERE variable_id IS NOT NULL
                      )
                  ) f USING (variable_id, latitude, longitude, year, month)
              )
              """
            : string.Empty;
        var sourceAlias = checkDuplicates ? "fresh" : "cells";

        return $"""
            INSERT INTO {FactTable}
                (observation_id, variable_id, latitude, longitude, year, month, observation_value, anomaly_value)
            WITH src AS (
                SELECT
                    CAST(variable_id AS TINYINT) AS variable_id,
                    CAST(latitude AS DECIMAL(6,3)) AS latitude,
                    CAST(longitude AS DECIMAL(6,3)) AS longitude,
                    CAST(year("timestamp") AS SMALLINT) AS year,
                    CAST(month("timestamp") AS TINYINT) AS month,
                    CASE WHEN isfinite(CAST(value AS DOUBLE)) THEN CAST(value AS DOUBLE) END AS value,
                    CASE WHEN isfinite(CAST(anomaly AS DOUBLE)) THEN CAST(anomaly AS DOUBLE) END AS anomaly
                FROM read_parquet({literal})
                WHERE variable_id IS NOT NULL AND "timestamp" IS NOT NULL
                  AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
            ),
            cells AS (
                SELECT variable_id, latitude, longitude, year, month,
                       avg(value) AS value, avg(anomaly) AS anomaly
                FROM src
                GROUP BY variable_id, latitude, longitude, year, month
            ){freshCte}
            SELECT
                {previousMaxId} + row_number() OVER (ORDER BY variable_id, year, latitude, longitude, month),
                variable_id, latitude, longitude, year, month, value, anomaly
            FROM {sourceAlias}
            """;
    }

    /// <summary>
    /// Populates dim_location with observed cells from newly inserted facts.
    /// </summary>
    public static string InsertLocations(long previousMaxId) =>
        $"""
        INSERT OR IGNORE INTO dim_location (latitude, longitude, hemisphere, lat_band)
        SELECT DISTINCT
            latitude,
            longitude,
            CASE WHEN latitude >= 0 THEN 'N' ELSE 'S' END,
            CAST(floor(latitude / 10) * 10 AS SMALLINT)
        FROM {FactTable}
        WHERE observation_id > {previousMaxId}
        """;
}
