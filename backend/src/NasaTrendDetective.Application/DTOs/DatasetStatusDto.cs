using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Status of a variable: "observed" if a real dataset is loaded (with its provenance) or
/// "synthetic" if the API can only provide demonstration time series.
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
