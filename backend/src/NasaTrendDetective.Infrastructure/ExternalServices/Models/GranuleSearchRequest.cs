namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Parámetros de búsqueda de granules en CMR (search/granules.json).
/// </summary>
/// <param name="BoundingBox">Formato CMR "oeste,sur,este,norte".</param>
public sealed record GranuleSearchRequest(
    string ShortName,
    string? Version = null,
    DateTimeOffset? TemporalStart = null,
    DateTimeOffset? TemporalEnd = null,
    string? BoundingBox = null,
    int PageSize = 50,
    int PageNumber = 1)
{
    public static GranuleSearchRequest For(NasaDataset dataset) => new(dataset.ShortName, dataset.Version);
}
