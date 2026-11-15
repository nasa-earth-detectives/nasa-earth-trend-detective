namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Column mapping from a raw tabular dataset to the canonical tuple
/// (latitude, longitude, timestamp, value, anomaly). Each mission uses distinct column naming.
/// </summary>
public sealed class GridColumnMapping
{
    public string LatitudeColumn { get; set; } = "lat";

    public string LongitudeColumn { get; set; } = "lon";

    public string TimeColumn { get; set; } = "time";

    public string ValueColumn { get; set; } = "value";

    /// <summary>
    /// Optional anomaly column; if null, the canonical anomaly defaults to NULL.
    /// </summary>
    public string? AnomalyColumn { get; set; }

    /// <summary>
    /// DuckDB strptime format (e.g. "%Y-%m"). If null, TRY_CAST to TIMESTAMP is used.
    /// </summary>
    public string? TimeFormat { get; set; }

    /// <summary>
    /// Fill value representing missing data (e.g. 9999 in GISTEMP); converted to analytical NULL.
    /// </summary>
    public double? MissingValue { get; set; }

    public string Delimiter { get; set; } = ",";

    public static GridColumnMapping Default => new();
}
