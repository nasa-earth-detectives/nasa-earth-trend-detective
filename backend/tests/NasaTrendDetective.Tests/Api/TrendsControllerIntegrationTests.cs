using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Api;

public class TrendsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public TrendsControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) IntegrationTest/1.0");
    }

    [Fact]
    public async Task GetTrends_WithValidQuery_ReturnsSuccessAndStatistics()
    {
        var response = await _client.GetAsync("/api/trends?variable=1&startYear=2000&endYear=2024&latitude=78.22&longitude=15.63");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<TrendResultDto>();
        Assert.NotNull(result);
        Assert.Equal(2000, result.StartYear);
        Assert.Equal(2024, result.EndYear);
        Assert.NotNull(result.Direction);
    }

    [Fact]
    public async Task GetTrends_WithInvertedYears_ReturnsBadRequestProblemDetails()
    {
        var response = await _client.GetAsync("/api/trends?variable=1&startYear=2024&endYear=2000");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Parámetros temporales inválidos", content);
    }

    [Fact]
    public async Task AnalyzeSeries_WithCustomData_ReturnsComputedStatistics()
    {
        var request = new AnalyzeSeriesRequestDto
        {
            Variable = ClimateVariable.Gistemp,
            Observations = new List<AnnualObservation>
            {
                new(2020, 1.1),
                new(2021, 1.3),
                new(2022, 1.5),
                new(2023, 1.8),
                new(2024, 2.1)
            }
        };

        var response = await _client.PostAsJsonAsync("/api/trends/analyze", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<TrendResultDto>();
        Assert.NotNull(result);
        Assert.True(result.SensSlope > 0);
        Assert.Equal("Increasing", result.Direction);
    }

    [Fact]
    public async Task GetOpposingTrends_ReturnsPredefinedCases()
    {
        var response = await _client.GetAsync("/api/trends/opposing");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pairs = await response.Content.ReadFromJsonAsync<List<OpposingTrendPair>>();
        Assert.NotNull(pairs);
        Assert.Equal(3, pairs.Count);
        Assert.Contains(pairs, p => p.PairId == "arctic-atlantic-thermal");
    }

    [Fact]
    public async Task BotShield_BlocksKnownMaliciousUserAgent()
    {
        using var maliciousClient = _factory.CreateClient();
        maliciousClient.DefaultRequestHeaders.UserAgent.Clear();
        maliciousClient.DefaultRequestHeaders.UserAgent.ParseAdd("sqlmap/1.4.11");

        var response = await maliciousClient.GetAsync("/api/trends?variable=1&startYear=2000&endYear=2024");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task BotShield_RejectsHoneypotTrigger()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/trends?variable=1&startYear=2000&endYear=2024");
        request.Headers.Add("X-Honeypot-Token", "automated-bot-payload");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
