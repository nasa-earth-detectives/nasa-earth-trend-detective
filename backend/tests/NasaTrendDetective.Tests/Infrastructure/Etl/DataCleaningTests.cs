using Microsoft.Extensions.Logging;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

public class DataCleaningTests
{
    private const string Header = "lat,lon,time,value,anomaly";

    [Fact]
    public async Task Normalize_ReplacesFillValuesAndOutOfRangeWithNull()
    {
        var options = new GridNormalizationOptions();
        options.Cleaning.Rules["ModisNdvi"] = new VariableCleaningRule
        {
            FillValues = [-3000], MinValidValue = -1, MaxValidValue = 1
        };
        options.Mappings["ModisNdvi"] = new GridColumnMapping { AnomalyColumn = "anomaly" };
        using var context = new GridNormalizerTestContext(options);
        var csv = context.WriteCsv("flags.csv", Header,
            "1,1,2020-01-01,-9999,-9999",
            "2,2,2020-01-01,9999,0.1",
            "3,3,2020-01-01,NaN,NaN",
            "4,4,2020-01-01,-3000,",
            "5,5,2020-01-01,1.5,",
            "6,6,2020-01-01,-1.01,",
            "7,7,2020-01-01,0.75,0.2");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.ModisNdvi));
        var values = await ReadCellsAsync(context, result);

        Assert.Equal(7, result.RowsWritten);
        Assert.All(values.Take(6), row => Assert.Null(row.Value));
        Assert.Null(values[0].Anomaly);
        Assert.Equal(0.1, values[1].Anomaly);
        Assert.Null(values[2].Anomaly);
        Assert.Equal(0.75, values[6].Value);
    }

    [Fact]
    public async Task Normalize_InterpolatesSinglePeriodGapLinearlyInTime()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("gap1.csv", Header,
            "10,10,2020-01-01,0.2,",
            "10,10,2020-02-01,-9999,",
            "10,10,2020-03-01,0.4,",
            "20,20,2021-01-01,1,",
            "20,20,2022-01-01,,",
            "20,20,2023-01-01,3,");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.GraceMass));
        var values = await ReadCellsAsync(context, result);

        // 31 días de enero sobre 60 días entre el 1-ene y el 1-mar de 2020 (bisiesto).
        Assert.Equal(0.2 + (0.2 * 31 / 60), values[1].Value!.Value, 10);
        Assert.Equal(2.0, values[4].Value!.Value, 10);
        Assert.Equal(2, result.Quality.ImputedValues);
    }

    [Fact]
    public async Task Normalize_DoesNotImputeGapsOfTwoPeriodsOrAcrossCells()
    {
        using var context = new GridNormalizerTestContext();
        var csv = context.WriteCsv("gap2.csv", Header,
            "10,10,2020-01-01,1,",
            "10,10,2020-02-01,-9999,",
            "10,10,2020-03-01,9999,",
            "10,10,2020-04-01,4,",
            "30,30,2020-01-01,1,",
            "40,40,2020-02-01,-9999,",
            "30,30,2020-03-01,3,");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Gistemp));
        var values = await ReadCellsAsync(context, result);

        Assert.Null(values[1].Value);
        Assert.Null(values[2].Value);
        Assert.Equal(4.0, values[3].Value);
        Assert.Equal(3.0, values[5].Value);
        Assert.Null(values[6].Value);
        Assert.Equal(0, result.Quality.ImputedValues);
    }

    [Fact]
    public async Task Normalize_ReportsAndLogsQualityMetrics()
    {
        var logger = new ListLogger<SpatialGridNormalizer>();
        using var context = new GridNormalizerTestContext(logger: logger);
        var csv = context.WriteCsv("quality.csv", Header,
            "1,1,2020-01-01,1,",
            "1,1,2020-02-01,-9999,",
            "1,1,2020-03-01,3,",
            "2,2,2020-01-01,9999,",
            "2,2,2020-02-01,-9999,",
            "2,2,2020-03-01,5,",
            "95,2,2020-03-01,5,");

        var result = await context.Normalizer.NormalizeAsync(new(csv, ClimateVariable.Oco2));
        var quality = result.Quality;

        Assert.Equal(ClimateVariable.Oco2, quality.Variable);
        Assert.Equal(6, quality.TotalObservations);
        Assert.Equal(3, quality.ValidBeforeImputation);
        Assert.Equal(1, quality.ImputedValues);
        Assert.Equal(4, quality.ValidAfterImputation);
        Assert.Equal(2, quality.NullAfterImputation);
        Assert.Equal(50.0, quality.ValidPercentBeforeImputation);
        Assert.Equal(66.67, quality.ValidPercentAfterImputation);

        var (level, message) = Assert.Single(logger.Entries);
        Assert.Equal(LogLevel.Information, level);
        Assert.Contains("Oco2", message);
        Assert.Contains("50% válidos antes", message);
        Assert.Contains("66.67% después", message);
    }

    [Fact]
    public void CleaningOptions_MergesFillValuesAndValidatesRange()
    {
        var options = new DataCleaningOptions();
        options.Rules["Gistemp"] = new VariableCleaningRule { FillValues = [-999, 9999] };
        options.Rules["Oco2"] = new VariableCleaningRule { MinValidValue = 500, MaxValidValue = 300 };

        var rule = options.Resolve("gistemp", mappingMissingValue: 32767);

        Assert.Equal([-9999, 9999, -999, 32767], rule.FillValues);
        Assert.Null(rule.MinValidValue);
        Assert.Equal([-9999, 9999], options.Resolve("ModisNdvi").FillValues);
        Assert.Throws<InvalidOperationException>(() => options.Resolve("Oco2"));
    }

    private static async Task<List<(double? Value, double? Anomaly)>> ReadCellsAsync(
        GridNormalizerTestContext context,
        GridNormalizationResult result)
    {
        var rows = await context.QueryAsync(
            "SELECT value, anomaly FROM read_parquet(" + GridNormalizerTestContext.Quote(result.OutputPath)
            + ") ORDER BY latitude, longitude, \"timestamp\"");
        return rows.Select(r => ((double?)r[0], (double?)r[1])).ToList();
    }
}
