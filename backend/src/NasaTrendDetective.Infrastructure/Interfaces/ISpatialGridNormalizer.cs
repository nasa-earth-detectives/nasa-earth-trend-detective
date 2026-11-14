using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Normalizes heterogeneous native grids (MODIS 0.05°, GRACE 3°, GISTEMP 2°) into canonical WGS84
/// tuples (variable_id, latitude, longitude, timestamp, value, anomaly) exported to SNAPPY Parquet.
/// </summary>
public interface ISpatialGridNormalizer
{
    Task<GridNormalizationResult> NormalizeAsync(
        GridNormalizationRequest request,
        CancellationToken cancellationToken = default);
}
