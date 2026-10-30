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
        _ => "ppm"
    };
}
