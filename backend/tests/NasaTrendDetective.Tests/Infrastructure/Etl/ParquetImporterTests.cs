using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

public sealed class ParquetImporterTests : IAsyncLifetime
{
    private ParquetImportTestContext _context = null!;

    public async Task InitializeAsync() => _context = await ParquetImportTestContext.CreateAsync();

    public Task DisposeAsync()
    {
        _context.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_GlobOverSeveralFiles_ImportsAllRows()
    {
        await _context.WriteParquetAsync("a.parquet", ParquetImportTestContext.CanonicalSampleSql + " WHERE v = 1");
        await _context.WriteParquetAsync("b.parquet", ParquetImportTestContext.CanonicalSampleSql + " WHERE v = 2");

        var result = await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);

        Assert.Equal(2L, result.FilesMatched);
        Assert.Equal(12L, result.SourceRows);
        Assert.Equal(12L, result.RowsImported);
        Assert.Equal(12L, await _context.CountAsync("fact_climate_observations"));
        Assert.Equal(2L, await _context.CountAsync("dim_location"));
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_MapsYearMonthAndAssignsIdsInPhysicalOrder()
    {
        await _context.WriteParquetAsync("sample.parquet", ParquetImportTestContext.CanonicalSampleSql);

        await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);

        var rows = await _context.Repository.QueryAsync(
            """
            SELECT observation_id, CAST(variable_id AS INTEGER), CAST(latitude AS DOUBLE),
                   CAST(year AS INTEGER), CAST(month AS INTEGER), observation_value
            FROM fact_climate_observations ORDER BY observation_id
            """,
            r => (Id: r.GetInt64(0), Var: r.GetInt32(1), Lat: r.GetDouble(2),
                Year: r.GetInt32(3), Month: r.GetInt32(4), Value: r.GetDouble(5)));

        Assert.Equal(Enumerable.Range(1, 12).Select(i => (long)i), rows.Select(r => r.Id));
        Assert.Equal((1L, 1, -4.61, 2020, 1, 11d), rows[0]);
        Assert.Equal(rows.OrderBy(r => r.Var).ThenBy(r => r.Year).ThenBy(r => r.Lat).ThenBy(r => r.Month), rows);
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_RunTwice_DoesNotDuplicateFacts()
    {
        await _context.WriteParquetAsync("sample.parquet", ParquetImportTestContext.CanonicalSampleSql);

        await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);
        var second = await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);

        Assert.Equal(0L, second.RowsImported);
        Assert.Equal(12L, await _context.CountAsync("fact_climate_observations"));
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_NaNBecomesNullAndCleanNullsAreKept()
    {
        await _context.WriteParquetAsync("gaps.parquet", """
            SELECT CAST(1 AS TINYINT) AS variable_id, CAST(10 AS DECIMAL(5,2)) AS latitude,
                   CAST(20 AS DECIMAL(5,2)) AS longitude, make_timestamp(2021, m, 1, 0, 0, 0) AS "timestamp",
                   CASE m WHEN 1 THEN 'NaN'::DOUBLE WHEN 2 THEN NULL ELSE 0.5 END AS value,
                   CASE m WHEN 1 THEN 'Infinity'::DOUBLE ELSE NULL END AS anomaly
            FROM range(1, 4) t(m)
            """);

        await _context.Repository.ExecuteParquetIngestAsync(_context.Glob);

        var rows = await _context.Repository.QueryAsync(
            "SELECT observation_value, anomaly_value FROM fact_climate_observations ORDER BY month",
            r => (Value: r.IsDBNull(0) ? (double?)null : r.GetDouble(0), Anomaly: r.IsDBNull(1)));

        Assert.Equal([(null, true), (null, true), (0.5, true)], rows);
    }

    [Theory]
    [InlineData("SELECT 1 AS variable_id, 1.0 AS latitude, 2.0 AS longitude, now() AS \"timestamp\", 1.0 AS value", "falta la columna 'anomaly'")]
    [InlineData("SELECT 1 AS variable_id, 'x' AS latitude, 2.0 AS longitude, now() AS \"timestamp\", 1.0 AS value, 0.1 AS anomaly", "la columna 'latitude' es VARCHAR")]
    [InlineData("SELECT 1 AS variable_id, 1.0 AS latitude, 2.0 AS longitude, 2020 AS \"timestamp\", 1.0 AS value, 0.1 AS anomaly", "la columna 'timestamp' es INTEGER")]
    [InlineData("SELECT 1 AS variable_id, 1.0 AS latitude, 2.0 AS longitude, now() AS \"timestamp\", 1.0 AS value, 0.1 AS anomaly, 1 AS extra", "columna no canónica 'extra'")]
    public async Task ExecuteParquetIngestAsync_NonCanonicalColumns_FailsWithClearError(string selectSql, string expected)
    {
        await _context.WriteParquetAsync("bad.parquet", selectSql);

        var error = await Assert.ThrowsAsync<ParquetImportException>(
            () => _context.Repository.ExecuteParquetIngestAsync(_context.Glob));

        Assert.Contains("esquema canónico", error.Message);
        Assert.Contains(expected, error.Message);
        Assert.Equal(0L, await _context.CountAsync("fact_climate_observations"));
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_NoMatchingFiles_Throws()
    {
        var error = await Assert.ThrowsAsync<ParquetImportException>(
            () => _context.Repository.ExecuteParquetIngestAsync(_context.Glob));

        Assert.Contains("No se encontraron archivos Parquet", error.Message);
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_UnknownVariable_RollsBackEverything()
    {
        await _context.WriteParquetAsync("bad-fk.parquet",
            ParquetImportTestContext.CanonicalSampleSql.Replace("CAST(v AS TINYINT)", "CAST(v + 8 AS TINYINT)"));

        await Assert.ThrowsAnyAsync<Exception>(() => _context.Repository.ExecuteParquetIngestAsync(_context.Glob));

        Assert.Equal(0L, await _context.CountAsync("fact_climate_observations"));
        Assert.Equal(0L, await _context.CountAsync("dim_location"));
    }

    [Fact]
    public async Task ImportAsync_WithoutGlob_UsesConfiguredSourceGlob()
    {
        await _context.WriteParquetAsync("sample.parquet", ParquetImportTestContext.CanonicalSampleSql);
        var importer = new ParquetImporter(
            _context.Repository,
            Options.Create(new ParquetImportOptions { SourceGlob = _context.Glob }),
            NullLogger<ParquetImporter>.Instance);

        var result = await importer.ImportAsync();

        Assert.Equal(12L, result.RowsImported);
        Assert.Equal(ParquetImporter.ResolveGlob(_context.Glob), result.SourceGlob);
    }
}
