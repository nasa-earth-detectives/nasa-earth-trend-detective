using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// Observation unit per variable. The string values match those validated by the frontend
/// (observationDataSource.ts); changing them would break that validation.
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
        // No default branch with a unit: a new variable without a declared unit must fail
        // here, rather than being labeled in ppm.
        _ => throw new ArgumentOutOfRangeException(nameof(variable), variable, "Variable has no declared unit.")
    };
}
