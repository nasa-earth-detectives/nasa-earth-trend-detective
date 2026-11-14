using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Tests.Api;

/// <summary>
/// Without seeded datasets (the seed directory does not exist in the test execution folder):
/// the API must declare everything as synthetic and refuse to invent a grid.
/// </summary>
[Collection(ApiHostCollection.Name)]
public class DatasetsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public DatasetsControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) IntegrationTest/1.0");
    }

    [Fact]
    public async Task GetDatasets_ListsEveryVariableWithItsStatus()
    {
        var datasets = await _client.GetFromJsonAsync<List<DatasetStatusDto>>("/api/datasets");

        Assert.NotNull(datasets);
        Assert.Equal(["Gistemp", "ModisNdvi", "GraceMass", "Oco2"], datasets.Select(d => d.Code));
        Assert.All(datasets, d => Assert.Equal(d.Provenance is null ? "synthetic" : "observed", d.Status));
    }

    [Fact]
    public async Task GetGrid_VariableWithoutDataset_Returns404InsteadOfSyntheticGrid()
    {
        var response = await _client.GetAsync("/api/trends/grid?variable=Oco2&startYear=2000&endYear=2025");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("No observed data", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task GetGrid_WithInvertedYears_ReturnsBadRequest()
    {
        var response = await _client.GetAsync("/api/trends/grid?variable=Gistemp&startYear=2025&endYear=2000");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
