using Microsoft.AspNetCore.Mvc;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;

namespace NasaTrendDetective.Api.Controllers;

/// <summary>
/// Which variables have real data and where they come from. The frontend queries this to know, per
/// variable, whether the data is ready, still loading, or missing (and to label the source).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DatasetsController : ControllerBase
{
    private readonly IDatasetCatalogService _catalogService;

    public DatasetsController(IDatasetCatalogService catalogService)
    {
        _catalogService = catalogService ?? throw new ArgumentNullException(nameof(catalogService));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DatasetStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDatasets(CancellationToken cancellationToken)
    {
        // No cache: this is a query on a table with one row per variable and must reflect seeding as soon as it finishes.
        return Ok(await _catalogService.GetCatalogAsync(cancellationToken));
    }
}
