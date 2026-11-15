namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Catalog entry for supported NASA datasets.
/// </summary>
/// <param name="Key">Stable internal identifier (e.g. "gistemp-v4").</param>
/// <param name="ShortName">CMR short name or product name.</param>
/// <param name="Version">Product version in CMR, if applicable.</param>
/// <param name="Provider">Responsible DAAC / provider.</param>
/// <param name="RequiresAuthentication">Whether downloading requires an Earthdata Login token.</param>
/// <param name="DirectUrl">Direct public URL when the dataset is not queried via CMR.</param>
public sealed record NasaDataset(
    string Key,
    string Title,
    string ShortName,
    string? Version,
    string Provider,
    bool RequiresAuthentication,
    Uri? DirectUrl = null);
