namespace NasaTrendDetective.Infrastructure.Queries.Models;

/// <summary>
/// Global aggregation filters per spatial cell for the hexagon visualization layer.
/// <see cref="CellDecimals"/> defines the cell resolution: lat/lng are rounded to this number
/// of decimal places (0 = 1°, 1 = 0.1°, 2 = 0.01°, 3 = fact maximum resolution).
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
