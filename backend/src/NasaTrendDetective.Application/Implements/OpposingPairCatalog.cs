using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>Grid cell in the 2° grid identified by its center, with a geographic name.</summary>
public sealed record OpposingRegion(string Id, string Name, double Latitude, double Longitude);

/// <summary>Two regions whose trend is compared for the same variable.</summary>
public sealed record OpposingPairDefinition(
    string Id, string Title, ClimateVariable Variable, OpposingRegion First, OpposingRegion Second);

/// <summary>
/// Region pairs with opposing trends. Only locations and variables live here: the series, slope,
/// and verdict are computed from the loaded data on each query. Previously this service returned
/// hardcoded lines labeled with mission names.
///
/// Selected on 2026-11-14 among land cells, from 62° S to 62° N, with the highest Mann-Kendall |Z|
/// in the 1981-2025 MERRA-2 grid. If the data changes and a pair stops being opposing, the service
/// omits it instead of continuing to show it.
/// </summary>
public static class OpposingPairCatalog
{
    private static readonly OpposingRegion BrazilCentreWest = new("brazil-centre-west", "Centre-West Brazil", -19, -53);
    private static readonly OpposingRegion EasternBangladesh = new("eastern-bangladesh", "Eastern Bangladesh", 23, 91);

    public static IReadOnlyList<OpposingPairDefinition> Pairs { get; } =
    [
        new("air-temperature", "Air temperature: rising in Brazil, falling in Bangladesh",
            ClimateVariable.Merra2Temperature, BrazilCentreWest, new("northern-bangladesh", "Northern Bangladesh", 25, 89)),
        new("precipitation", "Precipitation: rising in Bangladesh, falling in Venezuela",
            ClimateVariable.Merra2Precipitation, EasternBangladesh, new("western-venezuela", "Western Venezuela", 9, -71)),
        new("soil-moisture", "Soil moisture: rising in the Russian Far East, falling in Canada",
            ClimateVariable.Merra2SoilMoisture, new("russian-far-east", "Russian Far East", 61, 173),
            new("ontario-quebec", "Ontario & Quebec (Canada)", 47, -79)),
        new("land-evaporation", "Land evaporation: rising in Gansu (China), falling in Southeast Brazil",
            ClimateVariable.Merra2Evaporation, new("gansu", "Gansu (China)", 37, 103),
            new("brazil-southeast", "Southeast Brazil", -19, -49)),
    ];
}
