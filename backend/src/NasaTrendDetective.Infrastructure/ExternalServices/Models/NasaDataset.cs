namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Entrada del catálogo de datasets NASA soportados.
/// </summary>
/// <param name="Key">Identificador interno estable (p.ej. "gistemp-v4").</param>
/// <param name="ShortName">Short name en CMR o nombre del producto.</param>
/// <param name="Version">Versión del producto en CMR, si aplica.</param>
/// <param name="Provider">DAAC / proveedor responsable.</param>
/// <param name="RequiresAuthentication">Si la descarga necesita token de Earthdata Login.</param>
/// <param name="DirectUrl">URL pública directa cuando el dataset no se busca vía CMR.</param>
public sealed record NasaDataset(
    string Key,
    string Title,
    string ShortName,
    string? Version,
    string Provider,
    bool RequiresAuthentication,
    Uri? DirectUrl = null);
