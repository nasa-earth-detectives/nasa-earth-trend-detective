using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// Unidad de las observaciones por variable. Los textos coinciden con los que valida el frontend
/// (observationDataSource.ts); cambiarlos rompe esa validación.
/// </summary>
public static class VariableUnits
{
    public static string For(ClimateVariable variable) => variable switch
    {
        ClimateVariable.Gistemp => "°C Anomaly",
        ClimateVariable.ModisNdvi => "NDVI",
        ClimateVariable.GraceMass => "cm EWH",
        ClimateVariable.Oco2 => "ppm",
        ClimateVariable.Merra2Temperature => "°C",
        ClimateVariable.Merra2Precipitation => "mm/day",
        ClimateVariable.Merra2Evaporation => "mm/day",
        ClimateVariable.Merra2SoilMoisture => "fraction",
        ClimateVariable.GpmPrecipitation => "mm/day",
        // Sin rama por defecto con unidad: una variable nueva sin unidad declarada debe fallar
        // aquí, no salir rotulada en ppm.
        _ => throw new ArgumentOutOfRangeException(nameof(variable), variable, "Variable sin unidad declarada.")
    };
}
