using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Opciones de la etapa de limpieza (sección "GridNormalization:Cleaning"). Las reglas se indexan
/// por nombre del enum ClimateVariable (p.ej. "ModisNdvi").
/// </summary>
public sealed class DataCleaningOptions
{
    /// <summary>
    /// Banderas de dato faltante habituales en productos NASA; siempre se tratan como NULL.
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
                $"Rango válido inconsistente para '{variableName}': "
                + $"MinValidValue ({rule!.MinValidValue}) > MaxValidValue ({rule.MaxValidValue}).");
        }

        return new ResolvedCleaningRule(fills, rule?.MinValidValue, rule?.MaxValidValue);
    }
}
