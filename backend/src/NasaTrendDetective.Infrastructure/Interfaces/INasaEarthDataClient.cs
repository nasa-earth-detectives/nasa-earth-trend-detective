using NasaTrendDetective.Infrastructure.ExternalServices.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// NASA EarthData client: CMR metadata search and streaming download with disk caching.
/// </summary>
public interface INasaEarthDataClient
{
    /// <summary>
    /// Searches granules in CMR (search/granules.json). The token is sent only if configured.
    /// </summary>
    Task<IReadOnlyList<CmrGranule>> SearchGranulesAsync(
        GranuleSearchRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Downloads a file by URL to disk cache. If it already exists completely, avoids network request.
    /// </summary>
    /// <exception cref="ExternalServices.NasaEarthDataAuthenticationException">
    /// Thrown when <paramref name="requiresAuthentication"/> is true and no token is configured.
    /// </exception>
    Task<NasaDownloadResult> DownloadFileAsync(
        Uri url,
        bool requiresAuthentication,
        string? fileName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Downloads the direct file of a catalog dataset (e.g. GISTEMP v4, public).
    /// </summary>
    Task<NasaDownloadResult> DownloadDatasetAsync(
        NasaDataset dataset,
        CancellationToken cancellationToken = default);
}
