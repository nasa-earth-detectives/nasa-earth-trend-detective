using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrendsController : ControllerBase
{
    private readonly ITrendAnalysisService _trendService;
    private readonly IOpposingTrendsService _opposingTrendsService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TrendsController> _logger;

    public TrendsController(
        ITrendAnalysisService trendService,
        IOpposingTrendsService opposingTrendsService,
        IMemoryCache cache,
        ILogger<TrendsController> logger)
    {
        _trendService = trendService ?? throw new ArgumentNullException(nameof(trendService));
        _opposingTrendsService = opposingTrendsService ?? throw new ArgumentNullException(nameof(opposingTrendsService));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
    [EnableRateLimiting("HeavyAnalysis")]
    [ProducesResponseType(typeof(TrendResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTrends([FromQuery] TrendQueryDto query, CancellationToken cancellationToken)
    {
        if (query.StartYear > query.EndYear)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Parámetros temporales inválidos",
                Detail = $"StartYear ({query.StartYear}) no puede ser mayor que EndYear ({query.EndYear}).",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var cacheKey = $"trend_{query.Variable}_{query.StartYear}_{query.EndYear}_{query.Latitude:F2}_{query.Longitude:F2}";
        if (_cache.TryGetValue<TrendResultDto>(cacheKey, out var cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        var result = await _trendService.AnalyzeTrendsAsync(query, cancellationToken);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(10));
        return Ok(result);
    }

    [HttpPost("analyze")]
    [EnableRateLimiting("HeavyAnalysis")]
    [ProducesResponseType(typeof(TrendResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AnalyzeSeries([FromBody] AnalyzeSeriesRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var result = await _trendService.AnalyzeCustomSeriesAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("observations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetObservations(
        [FromQuery] ClimateVariable variable,
        [FromQuery] int year,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"obs_{variable}_{year}";
        if (_cache.TryGetValue(cacheKey, out var cachedObs))
        {
            return Ok(cachedObs);
        }

        var observations = await _trendService.GetObservationsByYearAsync(variable, year, cancellationToken);
        _cache.Set(cacheKey, observations, TimeSpan.FromMinutes(15));
        return Ok(observations);
    }

    [HttpGet("opposing")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOpposingTrends(CancellationToken cancellationToken)
    {
        var pairs = await _opposingTrendsService.GetPredefinedPairsAsync(cancellationToken);
        return Ok(pairs);
    }

    [HttpGet("opposing/{pairId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOpposingTrendById(string pairId, CancellationToken cancellationToken)
    {
        var pair = await _opposingTrendsService.GetPairByIdAsync(pairId, cancellationToken);
        if (pair == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Caso de tendencia opuesta no encontrado",
                Detail = $"No se encontró un par teleconectado con el identificador '{pairId}'.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(pair);
    }
}
