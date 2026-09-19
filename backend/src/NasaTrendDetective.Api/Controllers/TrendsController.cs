using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrendsController : ControllerBase
{
    private readonly ITrendAnalysisService _trendService;

    public TrendsController(ITrendAnalysisService trendService)
    {
        _trendService = trendService;
    }

    [HttpGet]
    [EnableRateLimiting("HeavyAnalysis")]
    public async Task<IActionResult> GetTrends([FromQuery] TrendQueryDto query)
    {
        var results = await _trendService.AnalyzeTrendsAsync(query);
        return Ok(results);
    }

    [HttpGet("observations")]
    public async Task<IActionResult> GetObservations([FromQuery] ClimateVariable variable, [FromQuery] int year)
    {
        var observations = await _trendService.GetObservationsByYearAsync(variable, year);
        return Ok(observations);
    }
}
