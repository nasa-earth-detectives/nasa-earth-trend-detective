namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Mapeo de columnas de un dataset tabular crudo hacia la tupla canónica
/// (latitude, longitude, timestamp, value, anomaly). Cada misión nombra sus columnas distinto.
/// </summary>
public sealed class GridColumnMapping
{
    public string LatitudeColumn { get; set; } = "lat";

    public string LongitudeColumn { get; set; } = "lon";

    public string TimeColumn { get; set; } = "time";

    public string ValueColumn { get; set; } = "value";

    /// <summary>
    /// Columna de anomalía opcional; si es null la anomalía canónica queda en NULL.
    /// </summary>
    public string? AnomalyColumn { get; set; }

    /// <summary>
    /// Formato strptime de DuckDB (p.ej. "%Y-%m"). Si es null se usa TRY_CAST a TIMESTAMP.
    /// </summary>
    public string? TimeFormat { get; set; }

    /// <summary>
    /// Valor de relleno que representa dato faltante (p.ej. 9999 en GISTEMP); esas filas se descartan.
    /// </summary>
    public double? MissingValue { get; set; }

    public string Delimiter { get; set; } = ",";

    public static GridColumnMapping Default => new();
}
