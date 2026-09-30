namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Regla de limpieza efectiva para una ejecución: fill values combinados (estándar, variable y
/// MissingValue del mapeo) y rango físico válido.
/// </summary>
public sealed record ResolvedCleaningRule(
    IReadOnlyList<double> FillValues,
    double? MinValidValue,
    double? MaxValidValue);
