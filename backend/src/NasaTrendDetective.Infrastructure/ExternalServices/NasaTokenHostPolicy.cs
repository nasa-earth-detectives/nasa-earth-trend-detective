namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Determines which hosts may receive the Earthdata Login Bearer token: HTTPS only, and strictly
/// NASA Earthdata domains (or those added via configuration). Prevents token leakage to
/// external granule links or arbitrary URLs.
/// </summary>
public static class NasaTokenHostPolicy
{
    public static readonly IReadOnlyList<string> DefaultTrustedHosts =
    [
        "earthdata.nasa.gov",
        "earthdatacloud.nasa.gov",
        "eosdis.nasa.gov"
    ];

    public static bool IsTrusted(Uri url, IEnumerable<string> additionalHosts)
    {
        ArgumentNullException.ThrowIfNull(url);
        if (!url.IsAbsoluteUri || url.Scheme != Uri.UriSchemeHttps)
        {
            return false;
        }

        var host = url.IdnHost.TrimEnd('.');
        return DefaultTrustedHosts.Concat(additionalHosts)
            .Where(trusted => !string.IsNullOrWhiteSpace(trusted))
            .Select(trusted => trusted.Trim().TrimStart('.'))
            .Any(trusted => host.Equals(trusted, StringComparison.OrdinalIgnoreCase)
                || host.EndsWith("." + trusted, StringComparison.OrdinalIgnoreCase));
    }
}
