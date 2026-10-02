using NasaTrendDetective.Infrastructure.Queries.Models;
using NasaTrendDetective.Tests.Infrastructure.Etl;

namespace NasaTrendDetective.Tests.Infrastructure.Queries;

public sealed class CellAggregationTests : IAsyncLifetime
{
    private ParquetImportTestContext _context = null!;

    public async Task InitializeAsync()
    {
        _context = await ParquetImportTestContext.CreateAsync();
        await _context.WriteParquetAsync("cells.parquet", """
            SELECT CAST(v AS TINYINT) AS variable_id,
                   CAST(lat AS DECIMAL(5,2)) AS latitude,
                   CAST(10.02 AS DECIMAL(5,2)) AS longitude,
                   make_timestamp(y, 6, 1, 0, 0, 0) AS "timestamp",
                   CASE WHEN lat = 4.64 AND y = 2021 THEN NULL ELSE y - 2000 + lat END AS value,
                   CAST(0.5 AS DOUBLE) AS anomaly
            FROM range(1, 3) t1(v), (VALUES (4.61), (4.64)) t2(lat), range(2020, 2022) t3(y)
            """);
        await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);
    }

    public Task DisposeAsync()
    {
        _context.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetCellAggregatesAsync_RoundsCellsAndAveragesPerVariableAndYear()
    {
        var cells = await _context.Repository.GetCellAggregatesAsync(new CellAggregationRequest(CellDecimals: 1));

        Assert.Equal(4, cells.Count);
        var first = cells[0];
        Assert.Equal((1, 2020, 4.6, 10.0), (first.VariableId, first.Year, first.Latitude, first.Longitude));
        Assert.Equal(20 + 4.625, first.AverageValue!.Value, 6);
        Assert.Equal(0.5, first.AverageAnomaly);
        Assert.Equal((2L, 2L), (first.ObservationCount, first.ValidObservationCount));
    }

    [Fact]
    public async Task GetCellAggregatesAsync_IgnoresNullValuesInAverage()
    {
        var cells = await _context.Repository.GetCellAggregatesAsync(
            new CellAggregationRequest(VariableId: 2, FromYear: 2021, ToYear: 2021, CellDecimals: 1));

        var cell = Assert.Single(cells);
        Assert.Equal(21 + 4.61, cell.AverageValue!.Value, 6);
        Assert.Equal((2L, 1L), (cell.ObservationCount, cell.ValidObservationCount));
    }

    [Fact]
    public async Task GetCellAggregatesAsync_MaxDecimals_KeepsOriginalCells()
    {
        var cells = await _context.Repository.GetCellAggregatesAsync(
            new CellAggregationRequest(VariableId: 1, CellDecimals: CellAggregationRequest.MaxCellDecimals));

        Assert.Equal(4, cells.Count);
        Assert.Equal([4.61, 4.64, 4.61, 4.64], cells.Select(c => c.Latitude));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(4)]
    public async Task GetCellAggregatesAsync_InvalidDecimals_Throws(int decimals)
    {
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => _context.Repository.GetCellAggregatesAsync(new CellAggregationRequest(CellDecimals: decimals)));
    }
}
