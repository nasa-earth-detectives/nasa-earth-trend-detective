using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

/// <summary>
/// Casos límite de la imputación: periodos ausentes del archivo y lecturas duplicadas por celda.
/// </summary>
public class DataCleaningGapTests
{
    private const string Header = "lat,lon,time,value,anomaly";

    [Fact]
    public async Task Normalize_DoesNotImputeWhenMissingPeriodsAreAbsentFromFile()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("absent.csv", Header,
            "10,10,2020-01-01,1,",
            "10,10,2020-02-01,-9999,",
            "10,10,2020-12-01,12,");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Gistemp));
        var values = await ReadValuesAsync(context, result.OutputPath);

        Assert.Null(values[1]);
        Assert.Equal(0, result.Quality.ImputedValues);
    }

    [Fact]
    public async Task Normalize_AveragesDuplicateReadingsBeforeInterpolating()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("dupes.csv", Header,
            "10,10,2020-01-01,400,",
            "10,10,2020-01-01,402,",
            "10.001,10.001,2020-01-01,404,",
            "10,10,2020-02-01,-9999,",
            "10,10,2020-03-01,410,");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Oco2));
        var values = await ReadValuesAsync(context, result.OutputPath);

        Assert.Equal(3, values.Count);
        Assert.Equal(402.0, values[0]!.Value, 10);
        // 31 de 60 días entre el 1-ene y el 1-mar de 2020 (bisiesto), partiendo del promedio 402.
        Assert.Equal(402 + (8.0 * 31 / 60), values[1]!.Value, 10);
        Assert.Equal(1, result.Quality.ImputedValues);
    }

    private static async Task<List<double?>> ReadValuesAsync(GridNormalizerTestContext context, string path)
    {
        var rows = await context.QueryAsync(
            "SELECT value FROM read_parquet(" + GridNormalizerTestContext.Quote(path)
            + ") ORDER BY latitude, longitude, \"timestamp\"");
        return rows.Select(r => (double?)r[0]).ToList();
    }
}
