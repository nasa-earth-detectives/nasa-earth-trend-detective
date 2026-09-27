using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Etapa de limpieza en SQL DuckDB sobre la tupla canónica:
/// 1) fill values, NaN/Infinito y valores fuera del rango físico => NULL analítico;
/// 2) interpolación temporal lineal SOLO de huecos de un único periodo (fila NULL con vecinas
///    válidas inmediatas en la misma celda); huecos de 2 o más periodos quedan NULL.
/// Añade las columnas auxiliares is_valid e is_imputed para las métricas de calidad.
/// </summary>
/// <remarks>
/// Varias lecturas crudas que caen en la misma celda y timestamp (p.ej. sondeos OCO-2) se promedian
/// antes de interpolar, para que la ventana temporal sea determinista. El periodo de cada celda es
/// su menor paso entre timestamps consecutivos; solo se imputa si las vecinas válidas distan como
/// máximo <see cref="MaxGapInPeriods"/> periodos, así los periodos ausentes del archivo también
/// cuentan como hueco (enero, febrero NULL y diciembre no se interpola).
/// </remarks>
internal static class DataCleaningSql
{
    /// <summary>
    /// Distancia máxima entre vecinas válidas, en periodos (2 = un único periodo faltante). El margen
    /// de 0.5 absorbe meses de 28 a 31 días.
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
