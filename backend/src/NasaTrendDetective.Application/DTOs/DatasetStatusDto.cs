using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Estado de una variable: "observed" si hay un dataset real cargado (con su procedencia) o
/// "synthetic" si la API solo puede ofrecer series de demostración.
/// </summary>
public class DatasetStatusDto
{
    public const string Observed = "observed";
    public const string Synthetic = "synthetic";

    public ClimateVariable Variable { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = Synthetic;
    public DatasetProvenance? Provenance { get; set; }
}
