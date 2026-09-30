namespace NasaTrendDetective.Infrastructure.Queries.Models;

/// <summary>
/// Filtros de la agregación global por celda espacial para la capa de hexágonos.
/// <see cref="CellDecimals"/> define el tamaño de celda: lat/lng se redondean a ese número de
/// decimales (0 = 1°, 1 = 0.1°, 2 = 0.01°, 3 = resolución máxima del hecho).
/// </summary>
public sealed record CellAggregationRequest(
    byte? VariableId = null,
    int? FromYear = null,
    int? ToYear = null,
    int CellDecimals = CellAggregationRequest.DefaultCellDecimals)
{
    public const int DefaultCellDecimals = 1;
    public const int MaxCellDecimals = 3;
}
