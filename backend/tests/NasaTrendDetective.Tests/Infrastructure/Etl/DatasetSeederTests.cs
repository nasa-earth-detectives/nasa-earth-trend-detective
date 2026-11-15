using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

public sealed class DatasetSeederTests : IAsyncLifetime
{
    /// <summary>2 cells x 12 months in 2020 and 2021 for Gistemp = 48 rows.</summary>
    private const string GistempSql = """
        SELECT CAST(1 AS TINYINT) AS variable_id,
               CAST(lat AS DECIMAL(5,2)) AS latitude,
               CAST(15.00 AS DECIMAL(5,2)) AS longitude,
               make_timestamp(y, m, 1, 0, 0, 0) AS "timestamp",
               CAST(y - 2000 + m / 100 AS DOUBLE) AS value,
               CAST(y - 2000 + m / 100 AS DOUBLE) AS anomaly
        FROM (VALUES (79.00), (-1.00)) t1(lat), range(2020, 2022) t2(y), range(1, 13) t3(m)
        """;

    private ParquetImportTestContext _context = null!;
    private DatasetSeeder _seeder = null!;

    public async Task InitializeAsync()
    {
        _context = await ParquetImportTestContext.CreateAsync();
        var importer = new ParquetImporter(
            _context.Repository, Options.Create(new ParquetImportOptions()), NullLogger<ParquetImporter>.Instance);
        _seeder = new DatasetSeeder(
            _context.Repository,
            importer,
            Options.Create(new DatasetSeedOptions { Directory = _context.WorkDirectory }),
            NullLogger<DatasetSeeder>.Instance);
    }

    public Task DisposeAsync()
    {
        _context.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task SeedAsync_ImportsFactsAndRegistersProvenance_ThenSkipsWhenUnchanged()
    {
        await _context.WriteParquetAsync("gistemp.parquet", GistempSql);
        await WriteManifestAsync("gistemp", "Gistemp");

        var first = Assert.Single(await _seeder.SeedAsync());
        var second = Assert.Single(await _seeder.SeedAsync());

        Assert.Equal(DatasetSeedStatus.Imported, first.Status);
        Assert.Equal(48L, first.Rows);
        Assert.Equal(DatasetSeedStatus.Unchanged, second.Status);
        Assert.Equal(48L, await _context.CountAsync("fact_climate_observations"));

        var provenance = await new DatasetCatalogRepository(_context.Repository).GetAsync(ClimateVariable.Gistemp);
        Assert.NotNull(provenance);
        Assert.Equal("°C / year", provenance.TrendUnit);
        Assert.True(provenance.Interim);
        Assert.Equal(48L, provenance.RowCount);
    }

    [Fact]
    public async Task SeedAsync_UnchangedParquetWithUpdatedManifest_RefreshesProvenanceWithoutReimporting()
    {
        await _context.WriteParquetAsync("gistemp.parquet", GistempSql);
        await WriteManifestAsync("gistemp", "Gistemp", "Legacy Spanish Name", "°C / año", "Legacy citation");

        var first = Assert.Single(await _seeder.SeedAsync());
        Assert.Equal(DatasetSeedStatus.Imported, first.Status);

        await WriteManifestAsync("gistemp", "Gistemp", "GISTEMP v4 250km", "°C / year", "NASA GISS 2026 citation");
        var second = Assert.Single(await _seeder.SeedAsync());

        Assert.Equal(DatasetSeedStatus.Unchanged, second.Status);
        Assert.Equal(48L, second.Rows);
        Assert.Equal(48L, await _context.CountAsync("fact_climate_observations"));

        var provenance = await new DatasetCatalogRepository(_context.Repository).GetAsync(ClimateVariable.Gistemp);
        Assert.NotNull(provenance);
        Assert.Equal("GISTEMP v4 250km", provenance.Product);
        Assert.Equal("°C / year", provenance.TrendUnit);
        Assert.Equal("NASA GISS 2026 citation", provenance.Citation);
    }

    [Fact]
    public async Task SeedAsync_ChangedParquet_ReplacesFactsOfThatVariableOnly()
    {
        await _context.WriteParquetAsync("gistemp.parquet", GistempSql);
        await WriteManifestAsync("gistemp", "Gistemp");
        await _seeder.SeedAsync();

        // New source with fewer cells: old Gistemp facts must not remain mixed.
        File.Delete(Path.Combine(_context.WorkDirectory, "gistemp.parquet"));
        await _context.WriteParquetAsync("gistemp.parquet", GistempSql.Replace("(VALUES (79.00), (-1.00))", "(VALUES (79.00))"));

        var outcome = Assert.Single(await _seeder.SeedAsync());

        Assert.Equal(DatasetSeedStatus.Imported, outcome.Status);
        Assert.Equal(24L, await _context.CountAsync("fact_climate_observations"));
    }

    [Fact]
    public async Task SeedAsync_ParquetOfAnotherVariable_FailsWithoutTouchingFacts()
    {
        await _context.WriteParquetAsync("ndvi.parquet", GistempSql);
        await WriteManifestAsync("ndvi", "ModisNdvi");

        var outcome = Assert.Single(await _seeder.SeedAsync());

        Assert.Equal(DatasetSeedStatus.Failed, outcome.Status);
        Assert.Contains("variable_id", outcome.Message);
        Assert.Equal(0L, await _context.CountAsync("fact_climate_observations"));
        Assert.Equal(0L, await _context.CountAsync("dataset_provenance"));
    }

    [Fact]
    public async Task SeedAsync_ManifestWithoutParquet_IsSkipped()
    {
        await WriteManifestAsync("orphan", "Gistemp");

        Assert.Equal(DatasetSeedStatus.Skipped, Assert.Single(await _seeder.SeedAsync()).Status);
    }

    [Fact]
    public async Task SeedAsync_MissingDirectory_ReturnsNothing()
    {
        Assert.Empty(await _seeder.SeedAsync(Path.Combine(_context.WorkDirectory, "does-not-exist")));
    }

    [Fact]
    public async Task LoadAsync_InvalidManifest_ListsEveryProblem()
    {
        var path = Path.Combine(_context.WorkDirectory, "invalid" + DatasetManifest.FileSuffix);
        await File.WriteAllTextAsync(path, """{ "variable": "Ozone", "resolutionDegrees": 0 }""");

        var error = await Assert.ThrowsAsync<InvalidDataException>(() => DatasetManifest.LoadAsync(path));

        Assert.Contains("Ozone", error.Message);
        Assert.Contains("trendUnit", error.Message);
        Assert.Contains("resolutionDegrees", error.Message);
    }

    private Task WriteManifestAsync(
        string stem,
        string variable,
        string product = "Test product",
        string trendUnit = "°C / year",
        string citation = "Test citation")
    {
        var manifest = new
        {
            variable,
            provider = "test",
            product,
            baseline = "1951-1980",
            unit = "°C Anomaly",
            trendUnit,
            interim = true,
            resolutionDegrees = 2.0,
            sourceUrl = "https://example.invalid/source.nc",
            sourceFile = "source.nc",
            sourceSha256 = new string('a', 64),
            retrievedAt = "2026-10-05T04:09:47+00:00",
            coverageStart = 2020,
            coverageEnd = 2021,
            lastMonth = "2021-12",
            citation
        };
        return File.WriteAllTextAsync(
            Path.Combine(_context.WorkDirectory, stem + DatasetManifest.FileSuffix), JsonSerializer.Serialize(manifest));
    }
}
