using Microsoft.AspNetCore.Mvc;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;

namespace NasaTrendDetective.Api.Controllers;

/// <summary>
/// Qué variables tienen datos reales y de dónde salen. El frontend lo consulta para decidir, por
/// variable, si pide datos a la API o usa su escenario de demostración (y para rotular la fuente).
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
        // Sin caché: es una consulta de una tabla de 4 filas y debe reflejar el sembrado en cuanto termina.
        return Ok(await _catalogService.GetCatalogAsync(cancellationToken));
    }
}
