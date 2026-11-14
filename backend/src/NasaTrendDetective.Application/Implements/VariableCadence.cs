using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// Cuántos periodos trae cada año de una variable y cuántos hacen falta para que ese año cuente.
/// GISTEMP es mensual: un año con pocos meses es un año en curso y no se compara de igual a igual
/// con años completos. MERRA-2 y GPM IMERG llegan ya como media anual de NASA POWER (una fila por celda y año):
/// exigirle nueve meses dejaría fuera todos sus años.
/// </summary>
public static class VariableCadence
{
    /// <summary>
    /// 9 de 12 meses (75 %): deja fuera un año en curso incompleto sin descartar celdas polares
    /// con algún mes sin dato. Es una regla del proyecto, no una norma citada.
    /// </summary>
    public const int MonthlyMinPeriodsPerYear = 9;

    public static bool IsAnnual(ClimateVariable variable) => variable is
        ClimateVariable.Merra2Temperature or ClimateVariable.Merra2Precipitation
        or ClimateVariable.Merra2Evaporation or ClimateVariable.Merra2SoilMoisture
        or ClimateVariable.GpmPrecipitation;

    public static int MinPeriodsPerYear(ClimateVariable variable) =>
        IsAnnual(variable) ? 1 : MonthlyMinPeriodsPerYear;
}
