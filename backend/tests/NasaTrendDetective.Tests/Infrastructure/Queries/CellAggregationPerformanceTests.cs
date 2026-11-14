using System.Diagnostics;
using NasaTrendDetective.Infrastructure.Queries.Models;
using NasaTrendDetective.Tests.Infrastructure.Etl;

namespace NasaTrendDetective.Tests.Infrastructure.Queries;

/// <summary>
/// Load test: ~200k synthetic rows in Parquet, bulk import and cell aggregation
/// in under 100 ms after a warm-up. Marked as Performance so it can be excluded in slow CI
/// (dotnet test --filter "Category!=Performance").
/// </summary>
[Trait("Category", "Performance")]
public sealed class CellAggregationPerformanceTests : IAsyncLifetime
{
    // 2 variables x 10 years x 12 months x (25 x 34) cells of 0.25 degrees = 204,000 rows.
    private const long ExpectedRows = 2L * 10 * 12 * 25 * 34;
    private const int MeasuredRuns = 5;

    private ParquetImportTestContext _context = null!;

    public async Task InitializeAsync() => _context = await ParquetImportTestContext.CreateAsync();

    public Task DisposeAsync()
    {
        _context.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task ImportAndAggregate_200kRows_CellQueryUnder100Milliseconds()
    {
        await _context.WriteParquetAsync("synthetic.parquet", """
            SELECT CAST(v AS TINYINT) AS variable_id,
                   CAST(-30 + i * 0.25 AS DECIMAL(5,2)) AS latitude,
                   CAST(-80 + j * 0.25 AS DECIMAL(5,2)) AS longitude,
                   make_timestamp(y, m, 1, 0, 0, 0) AS "timestamp",
                   CASE WHEN (i + j + m) % 17 = 0 THEN NULL ELSE sin(i + j + m) * 10 END AS value,
                   cos(i * j + y) AS anomaly
            FROM range(1, 3) tv(v), range(2010, 2020) ty(y), range(1, 13) tm(m),
                 range(0, 25) ti(i), range(0, 34) tj(j)
            """);

        var result = await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);

        Assert.Equal(ExpectedRows, result.SourceRows);
        Assert.Equal(ExpectedRows, result.RowsImported);
        Assert.Equal(ExpectedRows, await _context.CountAsync("fact_climate_observations"));

        var request = new CellAggregationRequest(CellDecimals: 0);
        var warmUp = await _context.Repository.GetCellAggregatesAsync(request);
        Assert.Equal(ExpectedRows, warmUp.Sum(c => c.ObservationCount));

        var timings = new List<double>();
        for (var run = 0; run < MeasuredRuns; run++)
        {
            var stopwatch = Stopwatch.StartNew();
            var cells = await _context.Repository.GetCellAggregatesAsync(request);
            stopwatch.Stop();
            Assert.Equal(warmUp.Count, cells.Count);
            timings.Add(stopwatch.Elapsed.TotalMilliseconds);
        }

        var median = timings.Order().ElementAt(MeasuredRuns / 2);
        Assert.True(median < 100, $"Cell aggregation took {median:F1} ms (median), expected < 100 ms.");
    }
}
