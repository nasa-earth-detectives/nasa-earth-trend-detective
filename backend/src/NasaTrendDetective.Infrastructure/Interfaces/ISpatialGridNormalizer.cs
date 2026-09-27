using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Normaliza grillas nativas heterogéneas (MODIS 0.05°, GRACE 3°, GISTEMP 2°) a tuplas canónicas
/// WGS84 (variable_id, latitude, longitude, timestamp, value, anomaly) exportadas a Parquet SNAPPY.
/// </summary>
public interface ISpatialGridNormalizer
{
    Task<GridNormalizationResult> NormalizeAsync(
        GridNormalizationRequest request,
        CancellationToken cancellationToken = default);
}
