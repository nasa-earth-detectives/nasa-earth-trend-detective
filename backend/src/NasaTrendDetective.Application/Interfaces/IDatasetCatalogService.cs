using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Application.Interfaces;

public interface IDatasetCatalogService
{
    /// <summary>One entry for each domain variable: observed, still loading, or unavailable.</summary>
    Task<IReadOnlyList<DatasetStatusDto>> GetCatalogAsync(CancellationToken cancellationToken = default);
}
