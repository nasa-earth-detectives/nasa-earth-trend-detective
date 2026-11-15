using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.ExternalServices;
using NasaTrendDetective.Infrastructure.ExternalServices.Models;
using NasaTrendDetective.Tests.Api;

namespace NasaTrendDetective.Tests.ScientificValidation;

/// <summary>
/// Live external NASA API validation across 2000-2025 comparing direct NASA GISTEMP, POWER MERRA-2,
/// CMR MODIS, GIBS WMTS, POWER IMERG Zarr, and GSFC GRACE endpoints against TrendStatisticsEngine and seeded DuckDB.
/// Run on demand or via scheduled/dispatch workflows so transient NASA maintenance does not block PRs.
/// </summary>
[Trait("Category", "LiveNasaApi")]
[Collection(ApiHostCollection.Name)]
public sealed class LiveNasaApiValidationTests(RealSeededApiFixture fixture)
    : IClassFixture<RealSeededApiFixture>, IDisposable
{
    private readonly HttpClient _apiClient = fixture.Client;
    private readonly HttpClient _nasaHttp = CreateNasaHttpClient();

    public void Dispose() => _nasaHttp.Dispose();

    [Fact]
    public async Task LiveGistempCsv_2000To2025_ConfirmsWarmingTrendAndSeededGridParity()
    {
        Assert.NotNull(NasaDatasetCatalog.GistempV4.DirectUrl);
        var csv = await _nasaHttp.GetStringAsync(NasaDatasetCatalog.GistempV4.DirectUrl);
        var observations = ParseGistempAnnualMeans(csv, 2000, 2025);

        Assert.Equal(26, observations.Count);
        var verdict = TrendStatisticsEngine.Analyze(observations);
        Assert.Equal(TrendDirection.Increasing, verdict.Direction);
        Assert.True(verdict.IsSignificant);
        Assert.True(verdict.Linear.IsSignificant);
        Assert.True(verdict.SensSlope > 0.015, $"Expected global warming > 0.015 C/yr, got {verdict.SensSlope}");

        var grid = await _apiClient.GetFromJsonAsync<GridTrendResultDto>(
            "/api/trends/grid?variable=Gistemp&startYear=2000&endYear=2025");
        Assert.NotNull(grid);
        Assert.True(grid.Cells.Average(c => c.SensSlope) > 0.015);
    }

    [Fact]
    public async Task LiveNasaPowerPoint_2000To2025_ValidatesMerra2UnitsAndSeededTrends()
    {
        const string powerUrl =
            "https://power.larc.nasa.gov/api/temporal/monthly/point"
            + "?parameters=T2M,PRECTOTCORR,EVLAND,GWETROOT&community=AG"
            + "&longitude=-47.0&latitude=-15.0&start=2000&end=2025&format=JSON";

        using var doc = JsonDocument.Parse(await _nasaHttp.GetStringAsync(powerUrl));
        var parametersMeta = doc.RootElement.GetProperty("parameters");
        var parameterSeries = doc.RootElement.GetProperty("properties").GetProperty("parameter");

        var mappings = new (string PowerKey, string ExpectedPowerUnit, ClimateVariable Variable, double MaxSlopeDelta)[]
        {
            ("T2M", "C", ClimateVariable.Merra2Temperature, 0.05),
            ("PRECTOTCORR", "mm/day", ClimateVariable.Merra2Precipitation, 0.05),
            ("EVLAND", "mm/day", ClimateVariable.Merra2Evaporation, 0.05),
            ("GWETROOT", "1", ClimateVariable.Merra2SoilMoisture, 0.01),
        };

        foreach (var (powerKey, expectedPowerUnit, variable, maxSlopeDelta) in mappings)
        {
            var actualPowerUnit = parametersMeta.GetProperty(powerKey).GetProperty("units").GetString();
            Assert.Equal(expectedPowerUnit, actualPowerUnit);

            var liveSeries = ParsePowerAnnualMeans(parameterSeries.GetProperty(powerKey), 2000, 2025);
            Assert.InRange(liveSeries.Count, 25, 26);

            var liveVerdict = TrendStatisticsEngine.Analyze(liveSeries);
            var seeded = await _apiClient.GetFromJsonAsync<TrendResultDto>(
                $"/api/trends?variable={variable}&startYear=2000&endYear=2025&latitude=-15&longitude=-47");

            Assert.NotNull(seeded);
            Assert.Equal(DatasetStatusDto.Observed, seeded.Source);
            Assert.True(double.IsFinite(liveVerdict.SensSlope));
            Assert.True(
                Math.Abs(liveVerdict.SensSlope - seeded.SensSlope) <= maxSlopeDelta,
                $"{variable}: live POWER slope {liveVerdict.SensSlope:F5} vs seeded {seeded.SensSlope:F5}");
        }
    }

    [Fact]
    public async Task LiveNasaCatalogAndImageryEndpoints_Confirm2000To2025UpstreamAvailability()
    {
        var cacheDir = Path.Combine(Path.GetTempPath(), $"ntd-cmr-live-{Guid.NewGuid():N}");
        try
        {
            var options = Options.Create(new NasaEarthDataOptions
            {
                CmrBaseUrl = "https://cmr.earthdata.nasa.gov/",
                CacheDirectory = cacheDir,
            });
            var cmrClient = new NasaEarthDataClient(_nasaHttp, options, NullLogger<NasaEarthDataClient>.Instance);
            var modisGranules = await cmrClient.SearchGranulesAsync(
                GranuleSearchRequest.For(NasaDatasetCatalog.ModisTerraNdvi) with
                {
                    TemporalStart = new DateTimeOffset(2000, 1, 1, 0, 0, 0, TimeSpan.Zero),
                    TemporalEnd = new DateTimeOffset(2025, 12, 31, 23, 59, 59, TimeSpan.Zero),
                    PageSize = 5,
                });
            Assert.NotEmpty(modisGranules);

            var capsXml = await _nasaHttp.GetStringAsync(
                "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml");
            Assert.Contains("MODIS_Terra_L3_NDVI_Monthly", capsXml, StringComparison.Ordinal);
            Assert.Contains("OCO-2_Carbon_Dioxide_Total_Column_Average", capsXml, StringComparison.Ordinal);

            var imergZmeta = await _nasaHttp.GetStringAsync(
                "https://nasa-power.s3.amazonaws.com/imerg/temporal/power_imerg_annual_temporal_utc.zarr/.zmetadata");
            Assert.Contains("IMERG_PRECTOT", imergZmeta, StringComparison.Ordinal);

            using var graceHead = new HttpRequestMessage(
                HttpMethod.Head,
                "https://earth.gsfc.nasa.gov/sites/default/files/geo/GSFC.glb_.200204_202606_RL06v2.0_OBP-ICE6GD.zip");
            using var graceResponse = await _nasaHttp.SendAsync(graceHead);
            Assert.Equal(HttpStatusCode.OK, graceResponse.StatusCode);
            Assert.True((graceResponse.Content.Headers.ContentLength ?? 0) > 10_000_000);
        }
        finally
        {
            if (Directory.Exists(cacheDir))
            {
                Directory.Delete(cacheDir, recursive: true);
            }
        }
    }

    private static List<AnnualObservation> ParseGistempAnnualMeans(string csv, int startYear, int endYear)
    {
        var observations = new List<AnnualObservation>();
        foreach (var rawLine in csv.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            var cols = rawLine.Trim().Split(',');
            if (cols.Length <= 13 || !int.TryParse(cols[0], out var year) || year < startYear || year > endYear)
            {
                continue;
            }

            if (double.TryParse(cols[13], NumberStyles.Float, CultureInfo.InvariantCulture, out var anomaly))
            {
                observations.Add(new AnnualObservation(year, anomaly, anomaly));
            }
        }

        return observations.OrderBy(o => o.Year).ToList();
    }

    private static List<AnnualObservation> ParsePowerAnnualMeans(JsonElement yearValues, int startYear, int endYear)
    {
        var observations = new List<AnnualObservation>();
        foreach (var entry in yearValues.EnumerateObject())
        {
            if (!entry.Name.EndsWith("13", StringComparison.Ordinal) || entry.Name.Length != 6)
            {
                continue;
            }

            if (!int.TryParse(entry.Name[..4], out var year) || year < startYear || year > endYear)
            {
                continue;
            }

            var value = entry.Value.GetDouble();
            if (value > -900)
            {
                observations.Add(new AnnualObservation(year, value));
            }
        }

        return observations.OrderBy(o => o.Year).ToList();
    }

    private static HttpClient CreateNasaHttpClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd("NasaTrendDetectiveValidation/1.0");
        return client;
    }
}
