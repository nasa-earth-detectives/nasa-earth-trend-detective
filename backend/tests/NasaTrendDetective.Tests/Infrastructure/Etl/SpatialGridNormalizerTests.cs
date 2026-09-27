using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

public class SpatialGridNormalizerTests
{
    private const string Header = "lat,lon,time,value";

    [Fact]
    public async Task Normalize_RoundsCoordinatesToTwoDecimals()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("round.csv", Header,
            "12.3456,45.6789,2020-01-01,1.0",
            "-33.333,-70.006,2020-01-01,2.0",
            "0.004,0.006,2020-01-01,3.0");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.ModisNdvi));
        var coords = await context.ReadCoordinatesAsync(result.OutputPath);

        Assert.Equal(3, result.RowsWritten);
        Assert.Contains((12.35m, 45.68m), coords);
        Assert.Contains((-33.33m, -70.01m), coords);
        Assert.Contains((0.00m, 0.01m), coords);
    }

    [Theory]
    [InlineData("0", 0.00)]
    [InlineData("90", 90.00)]
    [InlineData("179.99", 179.99)]
    [InlineData("180", -180.00)]
    [InlineData("190.5", -169.50)]
    [InlineData("270", -90.00)]
    [InlineData("359.99", -0.01)]
    [InlineData("360", 0.00)]
    [InlineData("-180", -180.00)]
    [InlineData("179.996", -180.00)]
    public async Task Normalize_WrapsLongitudeInto180Range(string rawLongitude, double expected)
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("wrap.csv", Header, $"10,{rawLongitude},2020-01-01,1.0");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.GraceMass));
        var coords = await context.ReadCoordinatesAsync(result.OutputPath);

        var single = Assert.Single(coords);
        Assert.Equal((decimal)expected, single.Lon);
        Assert.InRange(single.Lon, -180m, 179.99m);
    }

    [Fact]
    public async Task Normalize_DiscardsInvalidCoordinatesAndValues()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("invalid.csv", Header,
            "45,10,2020-01-01,1.0",
            "91,10,2020-01-01,1.0",
            "-90.5,10,2020-01-01,1.0",
            "45,361,2020-01-01,1.0",
            "45,-180.5,2020-01-01,1.0",
            "abc,10,2020-01-01,1.0",
            ",10,2020-01-01,1.0",
            "NaN,10,2020-01-01,1.0",
            "45,10,not-a-date,1.0",
            "45,10,2020-01-01,",
            "-90,-180,2020-02-01,2.0");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Gistemp));
        var coords = await context.ReadCoordinatesAsync(result.OutputPath);

        Assert.Equal(11, result.SourceRows);
        Assert.Equal(2, result.RowsWritten);
        Assert.Equal(9, result.RowsDiscarded);
        Assert.Equal([(45.00m, 10.00m), (-90.00m, -180.00m)], coords);
    }

    [Fact]
    public async Task Normalize_WritesReadableSnappyParquetWithCanonicalSchema()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("schema.csv", Header,
            "10,20,2020-02-01,2.0",
            "10,20,2020-01-01,1.0");

        var result = await context.Normalizer.NormalizeAsync(
            new(csv, ClimateVariable.Oco2, OutputFileName: "oco2_test"));
        var path = GridNormalizerTestContext.Quote(result.OutputPath);

        Assert.EndsWith("oco2_test.parquet", result.OutputPath);
        Assert.StartsWith(context.Options.OutputDirectory, result.OutputPath);
        Assert.True(File.Exists(result.OutputPath));

        var columns = await context.QueryAsync($"DESCRIBE SELECT * FROM read_parquet({path})");
        Assert.Equal(
            ["variable_id", "latitude", "longitude", "timestamp", "value", "anomaly"],
            columns.Select(c => (string)c[0]!));
        Assert.Equal("DECIMAL(5,2)", columns[1][1]);

        var codecs = await context.QueryAsync($"SELECT DISTINCT compression FROM parquet_metadata({path})");
        Assert.Equal("SNAPPY", Assert.Single(codecs)[0]?.ToString(), ignoreCase: true);

        var rows = await context.QueryAsync($"SELECT variable_id, \"timestamp\", value FROM read_parquet({path})");
        Assert.All(rows, r => Assert.Equal(4, Convert.ToInt32(r[0])));
        Assert.Equal(new DateTime(2020, 1, 1), rows[0][1]);
        Assert.Equal(1.0, rows[0][2]);
    }
}
