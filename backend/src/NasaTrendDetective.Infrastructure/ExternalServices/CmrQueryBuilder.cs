using System.Globalization;
using System.Text;
using NasaTrendDetective.Infrastructure.ExternalServices.Models;

namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Construye la URL de búsqueda de granules de CMR a partir de <see cref="GranuleSearchRequest"/>.
/// </summary>
internal static class CmrQueryBuilder
{
    private const string GranulesPath = "search/granules.json";
    private const string DateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'";

    public static Uri Build(string cmrBaseUrl, GranuleSearchRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.ShortName))
        {
            throw new ArgumentException("ShortName es obligatorio para buscar en CMR.", nameof(request));
        }

        var query = new StringBuilder();
        Append(query, "short_name", request.ShortName);
        Append(query, "version", request.Version);
        if (request.TemporalStart is not null || request.TemporalEnd is not null)
        {
            Append(query, "temporal", $"{Format(request.TemporalStart)},{Format(request.TemporalEnd)}");
        }

        Append(query, "bounding_box", request.BoundingBox);
        Append(query, "page_size", Math.Clamp(request.PageSize, 1, 2000).ToString(CultureInfo.InvariantCulture));
        Append(query, "page_num", Math.Max(request.PageNumber, 1).ToString(CultureInfo.InvariantCulture));

        var baseUri = new Uri(cmrBaseUrl.EndsWith('/') ? cmrBaseUrl : cmrBaseUrl + "/", UriKind.Absolute);
        return new Uri(baseUri, $"{GranulesPath}?{query}");
    }

    private static string Format(DateTimeOffset? value) =>
        value?.UtcDateTime.ToString(DateFormat, CultureInfo.InvariantCulture) ?? string.Empty;

    private static void Append(StringBuilder query, string key, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (query.Length > 0)
        {
            query.Append('&');
        }

        query.Append(key).Append('=').Append(Uri.EscapeDataString(value));
    }
}
