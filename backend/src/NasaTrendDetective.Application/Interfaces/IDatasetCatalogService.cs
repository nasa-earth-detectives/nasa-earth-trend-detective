using NasaTrendDetective.Application.DTOs;

namespace NasaTrendDetective.Application.Interfaces;

public interface IDatasetCatalogService
{
    /// <summary>Una entrada por cada variable del dominio, observada o sintética.</summary>
    Task<IReadOnlyList<DatasetStatusDto>> GetCatalogAsync(CancellationToken cancellationToken = default);
}
