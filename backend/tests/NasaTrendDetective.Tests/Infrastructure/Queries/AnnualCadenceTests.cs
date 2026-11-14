using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure.Queries;

/// <summary>
/// MERRA-2 entra como una fila por celda y año (month = 1). Con la regla mensual de 9 meses esas
/// series quedarían vacías: estas pruebas fijan que la cadencia anual las conserva y que la regla
/// mensual de GISTEMP sigue descartando un año en curso.
/// </summary>
public sealed class AnnualCadenceTests : IAsyncLifetime
{
    private readonly DuckDbConnectionFactory _factory = DuckDbTestHelpers.CreateFactory();
    private DuckDbRepository _repository = null!;

    public async Task InitializeAsync()
    {
        _repository = new DuckDbRepository(_factory);
        await new DuckDbSchemaInitializer(_factory).InitializeAsync();

        // Merra2Temperature (id 5): dos celdas, 2001-2012, una fila por año. Valor = año - 2000 y
        // anomalía = año - 2010, distintos para comprobar que cada columna llega a su sitio.
        await _repository.ExecuteAsync("""
            INSERT INTO fact_climate_observations
            SELECT row_number() OVER (), 5, lat, 20, y, 1, y - 2000, y - 2010
            FROM (VALUES (10.0), (-10.0)) c(lat), range(2001, 2013) t(y)
            """);

        // Gistemp (id 1) mensual en la misma celda: 2020 completo y 2021 con solo 8 meses.
        await _repository.ExecuteAsync("""
            INSERT INTO fact_climate_observations
            SELECT 1000 + row_number() OVER (), 1, 10.0, 20, y, m, y - 2000, y - 2000
            FROM range(2020, 2022) t(y), range(1, 13) mm(m)
            WHERE NOT (y = 2021 AND m > 8)
            """);
    }

    public Task DisposeAsync()
    {
        _factory.Dispose();
        return Task.CompletedTask;
    }

    [Theory]
    [InlineData(ClimateVariable.Gistemp, 9)]
    [InlineData(ClimateVariable.ModisNdvi, 9)]
    [InlineData(ClimateVariable.GraceMass, 9)]
    [InlineData(ClimateVariable.Oco2, 9)]
    [InlineData(ClimateVariable.Merra2Temperature, 1)]
    [InlineData(ClimateVariable.Merra2Precipitation, 1)]
    [InlineData(ClimateVariable.Merra2Evaporation, 1)]
    [InlineData(ClimateVariable.Merra2SoilMoisture, 1)]
    [InlineData(ClimateVariable.GpmPrecipitation, 1)]
    public void MinPeriodsPerYear_DependsOnTheCadenceOfTheVariable(ClimateVariable variable, int expected)
    {
        Assert.Equal(expected, VariableCadence.MinPeriodsPerYear(variable));
    }

    [Theory]
    [InlineData(ClimateVariable.Gistemp, "°C Anomaly")]
    [InlineData(ClimateVariable.Oco2, "ppm")]
    [InlineData(ClimateVariable.Merra2Temperature, "°C")]
    [InlineData(ClimateVariable.Merra2Precipitation, "mm/day")]
    [InlineData(ClimateVariable.Merra2Evaporation, "mm/day")]
    [InlineData(ClimateVariable.Merra2SoilMoisture, "fraction")]
    [InlineData(ClimateVariable.GpmPrecipitation, "mm/day")]
    public void VariableUnits_MatchTheStringsTheFrontendValidates(ClimateVariable variable, string expected)
    {
        Assert.Equal(expected, VariableUnits.For(variable));
    }

    [Fact]
    public async Task GridRepository_WithTheMonthlyRule_WouldDropEveryAnnualYear()
    {
        var cells = await new GridTrendRepository(_repository)
            .GetCellAnnualSeriesAsync(ClimateVariable.Merra2Temperature, 2001, 2012, minMonthsPerYear: 9);

        Assert.Empty(cells);
    }

    [Fact]
    public async Task GridService_AnnualDataset_KeepsEveryYearAndReportsTheRuleUsed()
    {
        var service = new GridTrendService(new GridTrendRepository(_repository), new SingleDatasetCatalog());

        var result = await service.AnalyzeGridAsync(
            new GridTrendQueryDto { Variable = ClimateVariable.Merra2Temperature, StartYear = 2001, EndYear = 2012 });

        Assert.NotNull(result);
        Assert.Equal(1, result.MinMonthsPerYear);
        Assert.Equal(2, result.Cells.Count);
        Assert.All(result.Cells, cell => Assert.Equal(12, cell.Years));
        // La serie sube exactamente 1 por año: la pendiente de Sen tiene que ser 1.
        Assert.All(result.Cells, cell => Assert.Equal(1.0, cell.SensSlope, precision: 9));
        Assert.All(result.Cells, cell => Assert.True(cell.IsSignificant));
    }

    [Fact]
    public async Task AnnualSeries_AnnualDataset_ReturnsOnePointPerYearWithValueAndAnomaly()
    {
        var series = await new TrendObservationRepository(_repository)
            .GetAnnualSeriesAsync(ClimateVariable.Merra2Temperature, 2001, 2012, latitude: 10, longitude: 20);

        Assert.Equal(Enumerable.Range(2001, 12), series.Select(o => o.Year));
        Assert.Equal(1.0, series[0].Value);
        Assert.Equal(-9.0, series[0].Anomaly);
        Assert.Equal(12.0, series[^1].Value);
        Assert.Equal(2.0, series[^1].Anomaly);
    }

    [Fact]
    public async Task AnnualSeries_MonthlyDataset_StillDropsTheYearInProgress()
    {
        var series = await new TrendObservationRepository(_repository)
            .GetAnnualSeriesAsync(ClimateVariable.Gistemp, 2020, 2021, latitude: 10, longitude: 20);

        Assert.Equal([2020], series.Select(o => o.Year));
    }

    [Fact]
    public async Task ObservationsByYear_AnnualDataset_ReturnsEveryCellWithItsUnit()
    {
        var observations = await new TrendObservationRepository(_repository)
            .GetObservationsByYearAsync(ClimateVariable.Merra2Temperature, 2005);

        Assert.Equal(2, observations.Count);
        Assert.All(observations, o => Assert.Equal("°C", o.Unit));
        Assert.All(observations, o => Assert.Equal(5.0, o.Value));
        Assert.All(observations, o => Assert.Equal(-5.0, o.Anomaly));
    }

    /// <summary>Catálogo mínimo: declara cargada la variable que se le pida, sin tocar DuckDB.</summary>
    private sealed class SingleDatasetCatalog : IDatasetCatalogRepository
    {
        public Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<DatasetProvenance>>([]);

        public Task<DatasetProvenance?> GetAsync(ClimateVariable variable, CancellationToken cancellationToken = default) =>
            Task.FromResult<DatasetProvenance?>(new DatasetProvenance(
                variable, "nasa-power-merra2", "MERRA-2 de prueba", "°C", "°C / año", "1991-2020", 2.0,
                "https://example.test/fuente", "fuente", "sha", DateTimeOffset.UnixEpoch, 2001, 2012,
                "2012-12", false, "cita", 24, DateTimeOffset.UnixEpoch));
    }
}
