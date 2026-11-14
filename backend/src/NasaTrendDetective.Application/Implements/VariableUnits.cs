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
        _ => "ppm"
    };
}
