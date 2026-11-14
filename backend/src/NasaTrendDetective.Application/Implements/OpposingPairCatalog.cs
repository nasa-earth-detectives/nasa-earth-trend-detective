using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>Celda de la grilla de 2° identificada por su centro, con un nombre geográfico.</summary>
public sealed record OpposingRegion(string Id, string Name, double Latitude, double Longitude);

/// <summary>Dos regiones cuya tendencia se compara en una misma variable.</summary>
public sealed record OpposingPairDefinition(
    string Id, string Title, ClimateVariable Variable, OpposingRegion First, OpposingRegion Second);

/// <summary>
/// Pares de regiones con tendencias opuestas. Aquí sólo hay lugares y variables: la serie, la pendiente
/// y el veredicto se calculan con los datos cargados en cada consulta. Antes este servicio devolvía
/// rectas escritas a mano rotuladas con nombres de misiones.
///
/// Elegidos el 2026-11-14 entre las celdas de tierra, de 62° S a 62° N, con mayor |Z| de Mann-Kendall
/// en la grilla MERRA-2 de 1981-2025. Si los datos cambian y un par deja de ser opuesto, el servicio
/// lo omite en lugar de seguir mostrándolo.
/// </summary>
public static class OpposingPairCatalog
{
    private static readonly OpposingRegion BrazilCentreWest = new("brazil-centre-west", "Centro-oeste de Brasil", -19, -53);
    private static readonly OpposingRegion EasternBangladesh = new("eastern-bangladesh", "Bangladés oriental", 23, 91);

    public static IReadOnlyList<OpposingPairDefinition> Pairs { get; } =
    [
        new("air-temperature", "Temperatura del aire: sube en Brasil, baja en Bangladés",
            ClimateVariable.Merra2Temperature, BrazilCentreWest, new("northern-bangladesh", "Norte de Bangladés", 25, 89)),
        new("precipitation", "Precipitación: sube en Bangladés, baja en Venezuela",
            ClimateVariable.Merra2Precipitation, EasternBangladesh, new("western-venezuela", "Occidente de Venezuela", 9, -71)),
        new("soil-moisture", "Humedad del suelo: sube en el extremo oriente ruso, baja en Canadá",
            ClimateVariable.Merra2SoilMoisture, new("russian-far-east", "Extremo oriente de Rusia", 61, 173),
            new("ontario-quebec", "Ontario y Quebec (Canadá)", 47, -79)),
        new("land-evaporation", "Evaporación: sube en Gansu (China), baja en el sureste de Brasil",
            ClimateVariable.Merra2Evaporation, new("gansu", "Gansu (China)", 37, 103),
            new("brazil-southeast", "Sureste de Brasil", -19, -49)),
    ];
}
