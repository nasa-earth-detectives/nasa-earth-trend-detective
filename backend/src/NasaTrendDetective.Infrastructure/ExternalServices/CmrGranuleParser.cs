using System.Globalization;
using System.Text.Json;
using NasaTrendDetective.Infrastructure.ExternalServices.Models;

namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Convierte la respuesta JSON de CMR (feed.entry[]) en <see cref="CmrGranule"/>.
/// </summary>
internal static class CmrGranuleParser
{
    private const string DataRel = "http://esipfed.org/ns/fedsearch/1.1/data#";

    public static IReadOnlyList<CmrGranule> Parse(JsonDocument document)
    {
        if (!document.RootElement.TryGetProperty("feed", out var feed)
            || !feed.TryGetProperty("entry", out var entries)
            || entries.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return entries.EnumerateArray().Select(ParseEntry).ToList();
    }

    private static CmrGranule ParseEntry(JsonElement entry) => new(
        GetString(entry, "id") ?? string.Empty,
        GetString(entry, "title") ?? string.Empty,
        ParseDate(GetString(entry, "time_start")),
        ParseDate(GetString(entry, "time_end")),
        ParseDouble(GetString(entry, "granule_size")),
        ParseDataLinks(entry));

    private static List<Uri> ParseDataLinks(JsonElement entry)
    {
        var links = new List<Uri>();
        if (!entry.TryGetProperty("links", out var array) || array.ValueKind != JsonValueKind.Array)
        {
            return links;
        }

        foreach (var link in array.EnumerateArray())
        {
            var isData = string.Equals(GetString(link, "rel"), DataRel, StringComparison.Ordinal);
            var isInherited = link.TryGetProperty("inherited", out var inherited)
                && inherited.ValueKind == JsonValueKind.True;
            if (isData && !isInherited && Uri.TryCreate(GetString(link, "href"), UriKind.Absolute, out var uri))
            {
                links.Add(uri);
            }
        }

        return links;
    }

    private static string? GetString(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value)
            ? value.ValueKind switch
            {
                JsonValueKind.String => value.GetString(),
                JsonValueKind.Number => value.GetRawText(),
                _ => null
            }
            : null;

    private static DateTimeOffset? ParseDate(string? value) =>
        DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var date)
            ? date
            : null;

    private static double? ParseDouble(string? value) =>
        double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number) ? number : null;
}
