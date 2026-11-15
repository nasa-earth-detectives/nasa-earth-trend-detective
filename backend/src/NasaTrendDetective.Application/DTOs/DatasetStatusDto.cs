using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

/// <summary>
/// Status of a variable: "observed" if a real dataset is loaded (with its provenance), "loading"
/// while startup seeding has not finished, or "unavailable" if there is no dataset for it. The API
/// never fabricates a series: without a dataset it returns no data and says so.
/// </summary>
public class DatasetStatusDto
{
    public const string Observed = "observed";
    public const string Loading = "loading";
    public const string Unavailable = "unavailable";

    public ClimateVariable Variable { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = Unavailable;
    public DatasetProvenance? Provenance { get; set; }
}
