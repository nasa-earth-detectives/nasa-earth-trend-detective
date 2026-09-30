namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Metadatos mínimos de un granule devuelto por la búsqueda CMR.
/// </summary>
public sealed record CmrGranule(
    string Id,
    string Title,
    DateTimeOffset? TimeStart,
    DateTimeOffset? TimeEnd,
    double? SizeMegabytes,
    IReadOnlyList<Uri> DataLinks);
