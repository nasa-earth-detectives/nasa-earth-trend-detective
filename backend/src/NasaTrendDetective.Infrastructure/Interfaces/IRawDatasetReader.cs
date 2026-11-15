using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Raw data source for the spatial grid normalizer. Each implementation translates a file format
/// into a DuckDB SELECT producing raw columns raw_latitude, raw_longitude, raw_time,
/// raw_value, and raw_anomaly (of any type; the normalizer applies TRY_CAST).
/// </summary>
/// <remarks>
/// EXTENSION POINT: currently only <c>CsvRawDatasetReader</c> is implemented. NetCDF (GISTEMP, GRACE),
/// HDF5/HDF-EOS (MODIS, OCO-2), and GeoTIFF are not yet natively read: supporting them requires registering another
/// implementation (e.g. via DuckDB's spatial extension or prior conversion to CSV/Parquet)
/// without altering the WGS84 normalization logic.
/// </remarks>
public interface IRawDatasetReader
{
    /// <summary>
    /// Indicates whether this reader supports the file (typically by file extension).
    /// </summary>
    bool CanRead(string sourcePath);

    /// <summary>
    /// Constructs the DuckDB SELECT statement exposing raw columns from the file.
    /// </summary>
    string BuildSelectSql(string sourcePath, GridColumnMapping mapping);
}
