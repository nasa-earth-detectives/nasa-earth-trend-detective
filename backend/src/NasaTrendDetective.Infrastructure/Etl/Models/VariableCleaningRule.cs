namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Regla de limpieza configurable para una variable: fill values propios y rango físico válido.
/// Los valores fuera de rango o marcados como relleno pasan a NULL analítico (no se descartan filas).
/// </summary>
public sealed class VariableCleaningRule
{
    /// <summary>
    /// Valores de bandera adicionales a los estándar (-9999, 9999) y a NaN/Infinito.
    /// </summary>
    public List<double> FillValues { get; set; } = [];

    /// <summary>
    /// Límite inferior físicamente posible (inclusive), p.ej. -1 para NDVI. Null = sin límite.
    /// </summary>
    public double? MinValidValue { get; set; }

    /// <summary>
    /// Límite superior físicamente posible (inclusive), p.ej. 1 para NDVI. Null = sin límite.
    /// </summary>
    public double? MaxValidValue { get; set; }
}
