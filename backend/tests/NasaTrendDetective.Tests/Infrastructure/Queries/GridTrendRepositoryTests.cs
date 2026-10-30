using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure.Queries;

public sealed class GridTrendRepositoryTests : IAsyncLifetime
{
    private readonly DuckDbConnectionFactory _factory = DuckDbTestHelpers.CreateFactory();
    private DuckDbRepository _repository = null!;

    public async Task InitializeAsync()
    {
        _repository = new DuckDbRepository(_factory);
        await new DuckDbSchemaInitializer(_factory).InitializeAsync();

        // Celda A (10, 20): 2020 y 2021 completos. Celda B (-10, 20): 2020 completo y 2021 con solo
        // 8 meses (año en curso). Valor = año - 2000 para que la media anual sea exacta.
        await _repository.ExecuteAsync("""
            INSERT INTO fact_climate_observations
            SELECT row_number() OVER (), 1, lat, 20, y, m, y - 2000, y - 2000
            FROM (VALUES (10.0), (-10.0)) c(lat), range(2020, 2022) t(y), range(1, 13) mm(m)
            WHERE NOT (lat = -10.0 AND y = 2021 AND m > 8)
            """);
    }

    public Task DisposeAsync()
    {
        _factory.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetCellAnnualSeriesAsync_GroupsByCellAndDropsIncompleteYears()
    {
        var cells = await new GridTrendRepository(_repository)
            .GetCellAnnualSeriesAsync(ClimateVariable.Gistemp, 2020, 2021, minMonthsPerYear: 9);

        Assert.Equal(2, cells.Count);
        var south = cells.Single(c => c.Latitude == -10.0);
        var north = cells.Single(c => c.Latitude == 10.0);
        Assert.Equal([2020], south.Years.Select(y => y.Year));
        Assert.Equal([2020, 2021], north.Years.Select(y => y.Year));
        Assert.Equal([20.0, 21.0], north.Years.Select(y => y.Value));
    }

    [Fact]
    public async Task GetObservationsByYearAsync_ReturnsOneRowPerCellWithUniqueIds()
    {
        var observations = await new TrendObservationRepository(_repository)
            .GetObservationsByYearAsync(ClimateVariable.Gistemp, 2021);

        Assert.Equal(2, observations.Count);
        Assert.Equal(2, observations.Select(o => o.Id).Distinct().Count());
        Assert.Contains(observations, o => o.Id == "Gistemp:2021:10.000:20.000" && o.Value == 21.0);
        Assert.All(observations, o => Assert.Equal("°C Anomaly", o.Unit));
    }

    [Fact]
    public async Task GetAnnualSeriesAsync_WithoutData_ReturnsEmptyInsteadOfSyntheticSeries()
    {
        var series = await new TrendObservationRepository(_repository)
            .GetAnnualSeriesAsync(ClimateVariable.Oco2, 2020, 2021);

        Assert.Empty(series);
    }
}
