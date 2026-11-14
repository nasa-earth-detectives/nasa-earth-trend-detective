using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// How many periods each year of a variable contains and how many are needed for that year to count.
/// GISTEMP is monthly: a year with few months is a year in progress and cannot be compared on equal terms
/// with complete years. MERRA-2 and GPM IMERG already arrive as an annual mean from NASA POWER (one row per cell and year):
/// requiring nine months would exclude all their years.
/// </summary>
public static class VariableCadence
{
    /// <summary>
    /// 9 out of 12 months (75%): excludes an incomplete year in progress without discarding polar cells
    /// with an occasional missing month. This is a project rule, not a cited standard.
    /// </summary>
    public const int MonthlyMinPeriodsPerYear = 9;

    public static bool IsAnnual(ClimateVariable variable) => variable is
        ClimateVariable.Merra2Temperature or ClimateVariable.Merra2Precipitation
        or ClimateVariable.Merra2Evaporation or ClimateVariable.Merra2SoilMoisture
        or ClimateVariable.GpmPrecipitation;

    public static int MinPeriodsPerYear(ClimateVariable variable) =>
        IsAnnual(variable) ? 1 : MonthlyMinPeriodsPerYear;
}
