using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Solicitud de normalización de un archivo crudo a la grilla canónica WGS84.
/// </summary>
/// <param name="SourcePath">Ruta del archivo crudo (CSV hoy; NetCDF/HDF5 son punto de extensión).</param>
/// <param name="Variable">Variable climática; define el variable_id de salida.</param>
/// <param name="Mapping">Mapeo explícito; si es null se usa el configurado para la variable.</param>
/// <param name="OutputFileName">Nombre del Parquet de salida; por defecto "{variable}_{origen}.parquet".</param>
public sealed record GridNormalizationRequest(
    string SourcePath,
    ClimateVariable Variable,
    GridColumnMapping? Mapping = null,
    string? OutputFileName = null);
