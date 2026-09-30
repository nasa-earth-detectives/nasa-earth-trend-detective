namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Decide a qué hosts se puede enviar el token Bearer de Earthdata Login: solo HTTPS y solo
/// dominios de NASA Earthdata (o los añadidos en configuración). Evita filtrar el token a
/// enlaces de granules o URLs arbitrarias.
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
