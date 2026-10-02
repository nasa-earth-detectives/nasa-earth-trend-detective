using NasaTrendDetective.Infrastructure.ExternalServices.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Cliente de NASA EarthData: búsqueda de metadatos en CMR y descarga en streaming con caché en disco.
/// </summary>
public interface INasaEarthDataClient
{
    /// <summary>
    /// Busca granules en CMR (search/granules.json). El token se envía solo si está configurado.
    /// </summary>
    Task<IReadOnlyList<CmrGranule>> SearchGranulesAsync(
        GranuleSearchRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Descarga un archivo por URL a la caché en disco. Si ya existe completo, no hace request.
    /// </summary>
    /// <exception cref="ExternalServices.NasaEarthDataAuthenticationException">
    /// Si <paramref name="requiresAuthentication"/> es true y no hay token configurado.
    /// </exception>
    Task<NasaDownloadResult> DownloadFileAsync(
        Uri url,
        bool requiresAuthentication,
        string? fileName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Descarga el archivo directo de un dataset del catálogo (p.ej. GISTEMP v4, público).
    /// </summary>
    Task<NasaDownloadResult> DownloadDatasetAsync(
        NasaDataset dataset,
        CancellationToken cancellationToken = default);
}
