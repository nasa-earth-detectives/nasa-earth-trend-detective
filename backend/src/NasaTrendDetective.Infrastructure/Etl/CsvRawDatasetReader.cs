using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Lector CSV basado en read_csv de DuckDB. Lee todo como VARCHAR para que la validación y
/// el tipado los haga el normalizador de forma uniforme (valores basura => fila descartada).
/// </summary>
public sealed class CsvRawDatasetReader : IRawDatasetReader
{
    private static readonly string[] SupportedExtensions = [".csv", ".txt", ".tsv"];

    public bool CanRead(string sourcePath) =>
        !string.IsNullOrWhiteSpace(sourcePath)
        && SupportedExtensions.Contains(Path.GetExtension(sourcePath), StringComparer.OrdinalIgnoreCase);

    public string BuildSelectSql(string sourcePath, GridColumnMapping mapping)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourcePath);
        ArgumentNullException.ThrowIfNull(mapping);

        var anomaly = string.IsNullOrWhiteSpace(mapping.AnomalyColumn)
            ? "CAST(NULL AS VARCHAR)"
            : DuckDbSqlText.Identifier(mapping.AnomalyColumn);

        return $"""
            SELECT
                {DuckDbSqlText.Identifier(mapping.LatitudeColumn)} AS raw_latitude,
                {DuckDbSqlText.Identifier(mapping.LongitudeColumn)} AS raw_longitude,
                {DuckDbSqlText.Identifier(mapping.TimeColumn)} AS raw_time,
                {DuckDbSqlText.Identifier(mapping.ValueColumn)} AS raw_value,
                {anomaly} AS raw_anomaly
            FROM read_csv({DuckDbSqlText.Literal(sourcePath)},
                header = true, all_varchar = true, delim = {DuckDbSqlText.Literal(mapping.Delimiter)})
            """;
    }
}
