namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Configurable cleaning rule for a variable: variable-specific fill values and valid physical range.
/// Out-of-range or fill values are converted to analytical NULL (rows are not dropped).
/// </summary>
public sealed class VariableCleaningRule
{
    /// <summary>
    /// Additional flag values beyond standards (-9999, 9999) and NaN/Infinity.
    /// </summary>
    public List<double> FillValues { get; set; } = [];

    /// <summary>
    /// Physically plausible lower bound (inclusive), e.g. -1 for NDVI. Null = unbounded.
    /// </summary>
    public double? MinValidValue { get; set; }

    /// <summary>
    /// Physically plausible upper bound (inclusive), e.g. 1 for NDVI. Null = unbounded.
    /// </summary>
    public double? MaxValidValue { get; set; }
}
