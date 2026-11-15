using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Application.Interfaces;

public interface IDatasetCatalogService
{
    /// <summary>One entry for each domain variable, indicating whether it is observed or synthetic.</summary>
    Task<IReadOnlyList<DatasetStatusDto>> GetCatalogAsync(CancellationToken cancellationToken = default);
}
