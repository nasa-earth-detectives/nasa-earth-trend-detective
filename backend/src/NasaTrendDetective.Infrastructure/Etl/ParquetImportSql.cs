namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// SQL nativo DuckDB del importador: todo ocurre en el motor (INSERT ... SELECT FROM read_parquet),
/// sin deserializar filas en .NET.
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

    /// <summary>
    /// Inserta los hechos nuevos: year/month salen de timestamp, NaN/Infinito pasan a NULL (los NULL de
    /// la limpieza se respetan, no se reimputa), varias filas del mismo mes y celda se consolidan con avg,
    /// se omiten celdas/meses ya cargados (reimportar es idempotente) y observation_id es determinista:
    /// max previo + row_number() en el orden físico (variable_id, year, latitude, longitude).
    /// </summary>
    public static string InsertFacts(string glob, long previousMaxId) =>
        $"""
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
            FROM read_parquet({DuckDbSqlText.Literal(glob)})
            WHERE variable_id IS NOT NULL AND "timestamp" IS NOT NULL
              AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
        ),
        cells AS (
            SELECT variable_id, latitude, longitude, year, month,
                   avg(value) AS value, avg(anomaly) AS anomaly
            FROM src
            GROUP BY variable_id, latitude, longitude, year, month
        ),
        fresh AS (
            SELECT c.* FROM cells c
            ANTI JOIN {FactTable} f USING (variable_id, latitude, longitude, year, month)
        )
        SELECT
            {previousMaxId} + row_number() OVER (ORDER BY variable_id, year, latitude, longitude, month),
            variable_id, latitude, longitude, year, month, value, anomaly
        FROM fresh
        ORDER BY variable_id, year, latitude, longitude, month
        """;

    /// <summary>
    /// Registra en dim_location las celdas observadas por los hechos recién insertados.
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
