using System.Net.Http.Json;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Tests.Api;

namespace NasaTrendDetective.Tests.ScientificValidation;

/// <summary>
/// End-to-end validation of trend calculations, units, prewhitening, FDR control, and opposing pairs
/// against the tracked NASA/MERRA-2/IMERG/MODIS/GRACE/OCO-2 seed Parquets for 2000-2025.
/// </summary>
[Collection(ApiHostCollection.Name)]
public class RealSeededTrends2000To2025Tests(RealSeededApiFixture fixture)
    : IClassFixture<RealSeededApiFixture>
{
    private readonly HttpClient _client = fixture.Client;

    public static TheoryData<ClimateVariable, int, int> VariableObservationWindows => new()
    {
        { ClimateVariable.Gistemp, 2000, 2025 },
        { ClimateVariable.ModisNdvi, 2000, 2025 },
        { ClimateVariable.Merra2Temperature, 2000, 2025 },
        { ClimateVariable.Merra2Precipitation, 2000, 2025 },
        { ClimateVariable.Merra2Evaporation, 2000, 2025 },
        { ClimateVariable.Merra2SoilMoisture, 2000, 2025 },
        { ClimateVariable.GpmPrecipitation, 2000, 2025 },
        { ClimateVariable.GraceMass, 2002, 2025 },
        { ClimateVariable.Oco2, 2015, 2025 },
    };

    [Fact]
    public async Task GetDatasets_SeedsAllNineVariablesAsObservedWithConsistentUnits()
    {
        var datasets = await _client.GetFromJsonAsync<List<DatasetStatusDto>>("/api/datasets");

        Assert.NotNull(datasets);
        Assert.Equal(9, datasets.Count);
        Assert.All(datasets, d =>
        {
            Assert.Equal(DatasetStatusDto.Observed, d.Status);
            Assert.NotNull(d.Provenance);
            var unit = VariableUnits.For(d.Variable);
            Assert.Equal(unit, d.Provenance.Unit);
            Assert.Equal(ExpectedTrendUnit(d.Variable), d.Provenance.TrendUnit);
            Assert.False(string.IsNullOrWhiteSpace(d.Provenance.Provider));
            Assert.False(string.IsNullOrWhiteSpace(d.Provenance.SourceUrl));
            Assert.True(d.Provenance.CoverageEnd >= 2025, $"{d.Code} ends at {d.Provenance.CoverageEnd}");
            Assert.True(d.Provenance.RowCount > 0, $"{d.Code} row count was 0");
        });
    }

    [Fact]
    public async Task GetTrends_WithoutYearParameters_DefaultsTo2000Through2025()
    {
        var result = await _client.GetFromJsonAsync<TrendResultDto>(
            "/api/trends?variable=Gistemp&latitude=79&longitude=15");

        Assert.NotNull(result);
        Assert.Equal(DatasetStatusDto.Observed, result.Source);
        Assert.Equal(2000, result.StartYear);
        Assert.Equal(2025, result.EndYear);
        Assert.NotNull(result.Observations);
        Assert.Equal(26, result.Observations.Count);
        Assert.Equal(2000, result.Observations[0].Year);
        Assert.Equal(2025, result.Observations[^1].Year);
    }

    [Theory]
    [MemberData(nameof(VariableObservationWindows))]
    public async Task GetGrid_ObservationWindows_ComputesFinitePrewhitenedAndCorrectedTrends(
        ClimateVariable variable, int startYear, int endYear)
    {
        var grid = await _client.GetFromJsonAsync<GridTrendResultDto>(
            $"/api/trends/grid?variable={variable}&startYear={startYear}&endYear={endYear}");

        Assert.NotNull(grid);
        Assert.Equal(variable, grid.Variable);
        Assert.Equal(startYear, grid.StartYear);
        Assert.Equal(endYear, grid.EndYear);
        Assert.Equal(ExpectedTrendUnit(variable), grid.Unit);
        Assert.Equal(2.0, grid.ResolutionDegrees);
        Assert.NotEmpty(grid.Cells);
        Assert.Equal(grid.Cells.Count(c => c.IsSignificant), grid.SignificantCells);
        Assert.Equal(grid.Cells.Count(c => c.IsSignificantCorrected), grid.CorrectedSignificantCells);
        Assert.True(grid.CorrectedSignificantCells <= grid.PrewhitenedSignificantCells);

        var maxSpan = endYear - startYear + 1;
        Assert.All(grid.Cells, cell =>
        {
            Assert.InRange(cell.Years, grid.MinYearsPerCell, maxSpan);
            Assert.True(double.IsFinite(cell.SensSlope));
            Assert.True(double.IsFinite(cell.SensSlopePerDecade));
            Assert.InRange(cell.PValue, 0.0, 1.0);
            Assert.InRange(cell.PrewhitenedPValue, 0.0, 1.0);
            Assert.InRange(cell.AdjustedPValue, cell.PrewhitenedPValue - 1e-12, 1.0);
        });
    }

    [Fact]
    public async Task GetPointTrends_2000To2025_VerifiesArcticWarmingCerradoAndGridParity()
    {
        var arctic = await _client.GetFromJsonAsync<TrendResultDto>(
            "/api/trends?variable=Gistemp&startYear=2000&endYear=2025&latitude=79&longitude=15");
        Assert.NotNull(arctic);
        Assert.Equal(DatasetStatusDto.Observed, arctic.Source);
        Assert.Equal(26, arctic.Observations?.Count);
        Assert.True(arctic.SensSlope > 0.02, $"Expected Arctic warming slope > 0.02, got {arctic.SensSlope}");
        Assert.True(arctic.IsSignificant);
        Assert.True(arctic.Linear.IsSignificant);
        Assert.Equal("Increasing", arctic.Direction);
        Assert.True(arctic.Prewhitened.SampleSize >= 20);
        Assert.InRange(arctic.Prewhitened.Lag1Autocorrelation, -1.0, 1.0);

        var cerrTemp = await _client.GetFromJsonAsync<TrendResultDto>(
            "/api/trends?variable=Merra2Temperature&startYear=2000&endYear=2025&latitude=-15&longitude=-47");
        Assert.NotNull(cerrTemp);
        Assert.Equal(DatasetStatusDto.Observed, cerrTemp.Source);
        Assert.Equal(26, cerrTemp.Observations?.Count);
        Assert.True(cerrTemp.SensSlope > 0.01, $"Expected positive Brazil T2M trend, got {cerrTemp.SensSlope}");
        Assert.True(cerrTemp.IsSignificant);

        foreach (var variable in new[]
                 {
                     ClimateVariable.ModisNdvi,
                     ClimateVariable.Merra2Precipitation,
                     ClimateVariable.Merra2Evaporation,
                     ClimateVariable.Merra2SoilMoisture,
                     ClimateVariable.GpmPrecipitation,
                 })
        {
            var grid = await _client.GetFromJsonAsync<GridTrendResultDto>(
                $"/api/trends/grid?variable={variable}&startYear=2000&endYear=2025");
            Assert.NotNull(grid);
            var cell = grid.Cells.OrderByDescending(c => c.Years).First();

            var point = await _client.GetFromJsonAsync<TrendResultDto>(
                $"/api/trends?variable={variable}&startYear=2000&endYear=2025&latitude={cell.Latitude}&longitude={cell.Longitude}");
            Assert.NotNull(point);
            Assert.Equal(DatasetStatusDto.Observed, point.Source);
            Assert.Equal(cell.SensSlope, point.SensSlope, precision: 6);
            Assert.Equal(cell.PValue, point.PValue, precision: 6);
        }
    }

    [Fact]
    public async Task GetGrid_GraceAndOco2_ReflectPhysicalIceLossAndAtmosphericCo2Rise()
    {
        var graceGrid = await _client.GetFromJsonAsync<GridTrendResultDto>(
            "/api/trends/grid?variable=GraceMass&startYear=2002&endYear=2025");
        Assert.NotNull(graceGrid);
        var greenland = graceGrid.Cells
            .Where(c => c.Latitude is >= 65 and <= 80 && c.Longitude is >= -55 and <= -25)
            .ToList();
        Assert.NotEmpty(greenland);
        Assert.True(greenland.Average(c => c.SensSlope) < 0,
            $"Expected Greenland mean EWH loss < 0, got {greenland.Average(c => c.SensSlope)}");

        var oco2Grid = await _client.GetFromJsonAsync<GridTrendResultDto>(
            "/api/trends/grid?variable=Oco2&startYear=2015&endYear=2025");
        Assert.NotNull(oco2Grid);
        Assert.True(oco2Grid.Cells.Average(c => c.SensSlope) > 1.5,
            $"Expected mean OCO-2 rise > 1.5 ppm/year, got {oco2Grid.Cells.Average(c => c.SensSlope)}");
    }

    [Fact]
    public async Task GetOpposingTrends_WithRealSeededMerra2_ReturnsFourValidDynamicPairs()
    {
        var pairs = await _client.GetFromJsonAsync<List<OpposingTrendPair>>("/api/trends/opposing");

        Assert.NotNull(pairs);
        Assert.Equal(
            ["air-temperature", "precipitation", "soil-moisture", "land-evaporation"],
            pairs.Select(p => p.PairId));

        Assert.All(pairs, pair =>
        {
            Assert.True(pair.DivergenceIndex > 0, $"{pair.PairId} divergence was {pair.DivergenceIndex}");
            Assert.True(pair.IncreasingRegion.Stats.SensSlope > 0);
            Assert.True(pair.DecreasingRegion.Stats.SensSlope < 0);
            Assert.True(pair.IncreasingRegion.Observations.Count >= 20);
            Assert.True(pair.DecreasingRegion.Observations.Count >= 20);
            Assert.Equal(2025, pair.IncreasingRegion.EndYear);
            Assert.Equal(2025, pair.DecreasingRegion.EndYear);
        });
    }

    private static string ExpectedTrendUnit(ClimateVariable variable) =>
        variable == ClimateVariable.Gistemp
            ? "°C / year"
            : $"{VariableUnits.For(variable)} / year";
}
