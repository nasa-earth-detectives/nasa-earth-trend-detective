namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Effective cleaning rule for an execution: combined fill values (standard, variable-specific,
/// and mapping MissingValue) and valid physical range.
/// </summary>
public sealed record ResolvedCleaningRule(
    IReadOnlyList<double> FillValues,
    double? MinValidValue,
    double? MaxValidValue);
