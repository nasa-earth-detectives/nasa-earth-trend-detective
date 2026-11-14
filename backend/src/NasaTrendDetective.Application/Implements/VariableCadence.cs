using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// How many periods each year contains for a variable and how many are required for that year to count.
/// GISTEMP is monthly: a year with too few months is an incomplete year in progress and is not comparable
/// to full years. MERRA-2 and GPM IMERG already arrive as annual means from NASA POWER (one row per cell
/// and year): requiring nine months would drop every year. OCO-2 XCO2 also enters as an annual mean: the
/// satellite samples a narrow swath and does not fill a 2-degree cell every month, so the converter
/// already decides which years have enough months (scripts/etl/gibs_oco2_to_csv.py).
/// </summary>
public static class VariableCadence
{
    /// <summary>
    /// 9 out of 12 months (75%): excludes an incomplete year in progress without discarding polar cells
    /// missing an occasional month. This is a project rule, not a cited standard.
    /// </summary>
    public const int MonthlyMinPeriodsPerYear = 9;

    public static bool IsAnnual(ClimateVariable variable) => variable is
        ClimateVariable.Merra2Temperature or ClimateVariable.Merra2Precipitation
        or ClimateVariable.Merra2Evaporation or ClimateVariable.Merra2SoilMoisture
        or ClimateVariable.GpmPrecipitation or ClimateVariable.Oco2;

    public static int MinPeriodsPerYear(ClimateVariable variable) =>
        IsAnnual(variable) ? 1 : MonthlyMinPeriodsPerYear;
}
