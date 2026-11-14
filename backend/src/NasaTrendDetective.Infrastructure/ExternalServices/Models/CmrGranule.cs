namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Minimal metadata for a granule returned by a CMR search.
/// </summary>
public sealed record CmrGranule(
    string Id,
    string Title,
    DateTimeOffset? TimeStart,
    DateTimeOffset? TimeEnd,
    double? SizeMegabytes,
    IReadOnlyList<Uri> DataLinks);
