using Microsoft.AspNetCore.Mvc;
using NasaTrendDetective.Application.Interfaces;

namespace NasaTrendDetective.Api.Controllers;

[ApiController]
[Route("api/opposing-trends")]
public class OpposingTrendsController : ControllerBase
{
    private readonly IOpposingTrendsService _opposingService;

    public OpposingTrendsController(IOpposingTrendsService opposingService)
    {
        _opposingService = opposingService ?? throw new ArgumentNullException(nameof(opposingService));
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var pairs = await _opposingService.GetPredefinedPairsAsync(cancellationToken);
        return Ok(pairs);
    }

    [HttpGet("{pairId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string pairId, CancellationToken cancellationToken)
    {
        var pair = await _opposingService.GetPairByIdAsync(pairId, cancellationToken);
        if (pair == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Caso no encontrado",
                Detail = $"No se encontró un par teleconectado con el identificador '{pairId}'.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(pair);
    }
}
