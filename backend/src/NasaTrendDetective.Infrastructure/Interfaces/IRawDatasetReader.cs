using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Fuente de datos crudos para el normalizador de grilla. Cada implementación traduce un formato
/// a un SELECT de DuckDB con las columnas crudas raw_latitude, raw_longitude, raw_time,
/// raw_value y raw_anomaly (de cualquier tipo; el normalizador aplica TRY_CAST).
/// </summary>
/// <remarks>
/// PUNTO DE EXTENSIÓN: hoy solo existe <c>CsvRawDatasetReader</c>. NetCDF (GISTEMP, GRACE),
/// HDF5/HDF-EOS (MODIS, OCO-2) y GeoTIFF NO se leen aún: para soportarlos basta registrar otra
/// implementación (p.ej. vía la extensión spatial de DuckDB o una conversión previa a CSV/Parquet)
/// sin tocar la lógica de normalización WGS84.
/// </remarks>
public interface IRawDatasetReader
{
    /// <summary>
    /// Indica si este lector soporta el archivo (normalmente por extensión).
    /// </summary>
    bool CanRead(string sourcePath);

    /// <summary>
    /// Construye el SELECT DuckDB que expone las columnas crudas del archivo.
    /// </summary>
    string BuildSelectSql(string sourcePath, GridColumnMapping mapping);
}
