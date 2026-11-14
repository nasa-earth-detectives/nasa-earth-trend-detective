using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Cleaning stage configuration options ("GridNormalization:Cleaning" section). Rules are indexed
/// by ClimateVariable enum name (e.g. "ModisNdvi").
/// </summary>
public sealed class DataCleaningOptions
{
    /// <summary>
    /// Common missing-value flags in NASA products; always treated as NULL.
    /// </summary>
    public static readonly IReadOnlyList<double> StandardFillValues = [-9999, 9999];

    public Dictionary<string, VariableCleaningRule> Rules { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    public ResolvedCleaningRule Resolve(string variableName, double? mappingMissingValue = null)
    {
        Rules.TryGetValue(variableName, out var rule);
        var fills = StandardFillValues
            .Concat(rule?.FillValues ?? [])
            .Concat(mappingMissingValue is { } missing ? [missing] : [])
            .Where(double.IsFinite)
            .Distinct()
            .ToList();

        if (rule?.MinValidValue > rule?.MaxValidValue)
        {
            throw new InvalidOperationException(
                $"Inconsistent valid range for '{variableName}': "
                + $"MinValidValue ({rule!.MinValidValue}) > MaxValidValue ({rule.MaxValidValue}).");
        }

        return new ResolvedCleaningRule(fills, rule?.MinValidValue, rule?.MaxValidValue);
    }
}
