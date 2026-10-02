using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Extensions;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

public class GridColumnMappingTests
{
    [Fact]
    public async Task Normalize_UsesConfiguredMappingPerVariable()
    {
        var options = new GridNormalizationOptions();
        options.Mappings["Gistemp"] = new GridColumnMapping
        {
            LatitudeColumn = "Latitude (deg)",
            LongitudeColumn = "LON",
            TimeColumn = "period",
            ValueColumn = "temp",
            AnomalyColumn = "tempanomaly",
            TimeFormat = "%Y-%m",
            MissingValue = 9999,
            Delimiter = ";"
        };
        using var context = new GridNormalizerTestContext(options);
        var csv = context.WriteCsv("gistemp.csv",
            "Latitude (deg);LON;period;temp;tempanomaly",
            "1;181;2021-03;14.2;0.8",
            "3;183;2021-03;9999;9999",
            "5;185;2021-04;14.5;");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Gistemp));
        var rows = await context.QueryAsync(
            "SELECT longitude, \"timestamp\", value, anomaly FROM read_parquet("
            + GridNormalizerTestContext.Quote(result.OutputPath) + ")");

        Assert.Equal(3, rows.Count);
        Assert.Equal(-179.00m, Convert.ToDecimal(rows[0][0]));
        Assert.Equal(new DateTime(2021, 3, 1), rows[0][1]);
        Assert.Equal(0.8, rows[0][3]);
        Assert.Null(rows[1][2]);
        Assert.Null(rows[1][3]);
        Assert.Null(rows[2][3]);
    }

    [Fact]
    public async Task Normalize_RejectsUnsupportedFormatAsExtensionPoint()
    {
        using var context = new GridNormalizerTestContext();
        var path = Path.Combine(context.WorkDirectory, "grace.nc");
        await File.WriteAllBytesAsync(path, [0x43, 0x44, 0x46, 0x01]);

        var error = await Assert.ThrowsAsync<NotSupportedException>(
            () => context.Normalizer.NormalizeAsync(new(path, ClimateVariable.GraceMass)));
        Assert.Contains("NetCDF", error.Message);
    }

    [Theory]
    [InlineData("../escape.parquet")]
    [InlineData("sub/dir.parquet")]
    public async Task Normalize_RejectsOutputNamesWithPaths(string outputName)
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("ok.csv", "lat,lon,time,value", "1,1,2020-01-01,1");

        await Assert.ThrowsAsync<ArgumentException>(
            () => context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Gistemp, OutputFileName: outputName)));
    }

    [Fact]
    public void CsvReader_DetectsExtensionsAndEscapesIdentifiers()
    {
        var reader = new CsvRawDatasetReader();
        var sql = reader.BuildSelectSql("C:/data/it's.csv", new GridColumnMapping { ValueColumn = "va\"l" });

        Assert.True(reader.CanRead("grid.CSV"));
        Assert.False(reader.CanRead("grid.nc4"));
        Assert.Contains("'C:/data/it''s.csv'", sql);
        Assert.Contains("\"va\"\"l\" AS raw_value", sql);
        Assert.Contains("CAST(NULL AS VARCHAR) AS raw_anomaly", sql);
    }

    [Fact]
    public void AddInfrastructure_RegistersGridNormalizerAndBindsOptions()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["DuckDb:DatabasePath"] = ":memory:",
            ["GridNormalization:OutputDirectory"] = "custom/normalized",
            ["GridNormalization:Mappings:ModisNdvi:ValueColumn"] = "NDVI",
            ["GridNormalization:Cleaning:Rules:ModisNdvi:MaxValidValue"] = "1",
            ["GridNormalization:Cleaning:Rules:ModisNdvi:FillValues:0"] = "-3000"
        }).Build();
        using var provider = new ServiceCollection().AddInfrastructure(configuration).BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<GridNormalizationOptions>>().Value;

        Assert.IsType<SpatialGridNormalizer>(provider.GetRequiredService<ISpatialGridNormalizer>());
        Assert.IsType<CsvRawDatasetReader>(Assert.Single(provider.GetServices<IRawDatasetReader>()));
        Assert.Equal("custom/normalized", options.OutputDirectory);
        Assert.Equal("NDVI", options.ResolveMapping(nameof(ClimateVariable.ModisNdvi)).ValueColumn);
        Assert.Equal("value", options.ResolveMapping(nameof(ClimateVariable.Oco2)).ValueColumn);
        var cleaning = options.Cleaning.Resolve(nameof(ClimateVariable.ModisNdvi));
        Assert.Equal(1, cleaning.MaxValidValue);
        Assert.Contains(-3000, cleaning.FillValues);
    }
}
