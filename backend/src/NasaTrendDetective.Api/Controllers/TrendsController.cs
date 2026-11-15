using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using NasaTrendDetective.Api.Services;
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
    private readonly IGridTrendService _gridTrendService;
    private readonly IMemoryCache _cache;
    private readonly GridTrendCache _gridCache;
    private readonly ILogger<TrendsController> _logger;

    public TrendsController(
        ITrendAnalysisService trendService,
        IOpposingTrendsService opposingTrendsService,
        IGridTrendService gridTrendService,
        IMemoryCache cache,
        GridTrendCache gridCache,
        ILogger<TrendsController> logger)
    {
        _trendService = trendService ?? throw new ArgumentNullException(nameof(trendService));
        _opposingTrendsService = opposingTrendsService ?? throw new ArgumentNullException(nameof(opposingTrendsService));
        _gridTrendService = gridTrendService ?? throw new ArgumentNullException(nameof(gridTrendService));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _gridCache = gridCache ?? throw new ArgumentNullException(nameof(gridCache));
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
                Title = "Invalid temporal parameters",
                Detail = $"StartYear ({query.StartYear}) cannot be greater than EndYear ({query.EndYear}).",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var cacheKey = $"trend_{query.Variable}_{query.StartYear}_{query.EndYear}_{query.Latitude:F2}_{query.Longitude:F2}";
        if (_cache.TryGetValue<TrendResultDto>(cacheKey, out var cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        var result = await _trendService.AnalyzeTrendsAsync(query, cancellationToken);
        _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
        {
            Size = 1,
            SlidingExpiration = TimeSpan.FromMinutes(10)
        });
        return Ok(result);
    }

    /// <summary>
    /// Mann-Kendall / Sen on each observed cell for the variable. Returns 404 if no real dataset is loaded:
    /// the client must say there is no data, rather than receiving an invented grid.
    /// </summary>
    [HttpGet("grid")]
    [EnableRateLimiting("HeavyAnalysis")]
    [ProducesResponseType(typeof(GridTrendResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGridTrends([FromQuery] GridTrendQueryDto query, CancellationToken cancellationToken)
    {
        if (query.StartYear > query.EndYear || query.EndYear - query.StartYear > 200)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid temporal parameters",
                Detail = $"Period {query.StartYear}-{query.EndYear} is invalid.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var body = await _gridCache.GetOrComputeAsync(
            query, token => _gridTrendService.AnalyzeGridAsync(query, token), pinned: false, cancellationToken);
        if (body == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "No observed data",
                Detail = $"Variable {query.Variable} does not have a real dataset loaded.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return GridBody(body);
    }

    /// <summary>
    /// Sends a grid from its cached, already compressed body. Browsers accept Brotli; for a client that
    /// does not, the body is expanded and the compression middleware picks whatever that client takes.
    /// </summary>
    private IActionResult GridBody(byte[] brotli)
    {
        Response.Headers.CacheControl = GridTrendCache.CacheControl;
        Response.Headers.Vary = "Accept-Encoding";
        var acceptsBrotli = Request.Headers.AcceptEncoding
            .SelectMany(header => (header ?? string.Empty).Split(','))
            .Any(token => token.Trim().Split(';')[0].Equals("br", StringComparison.OrdinalIgnoreCase));
        if (!acceptsBrotli)
        {
            return File(GridTrendCache.Decompress(brotli), "application/json; charset=utf-8");
        }

        Response.Headers.ContentEncoding = "br";
        return File(brotli, "application/json; charset=utf-8");
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
            Response.Headers.CacheControl = GridTrendCache.CacheControl;
            return Ok(cachedObs);
        }

        var observations = (await _trendService.GetObservationsByYearAsync(variable, year, cancellationToken)).ToList();
        if (observations.Count == 0)
        {
            // An empty year can be a dataset that has not finished loading: it must not be remembered,
            // neither here nor by a browser or a CDN, or the data would stay hidden after it arrives.
            Response.Headers.CacheControl = "no-store";
            return Ok(observations);
        }

        // A year of observations of a loaded dataset does not change until the next deploy.
        Response.Headers.CacheControl = GridTrendCache.CacheControl;
        _cache.Set(cacheKey, observations, new MemoryCacheEntryOptions
        {
            Size = 8,
            SlidingExpiration = TimeSpan.FromMinutes(5)
        });
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
                Title = "Opposing trend case not found",
                Detail = $"No teleconnected pair was found with identifier '{pairId}'.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(pair);
    }
}
