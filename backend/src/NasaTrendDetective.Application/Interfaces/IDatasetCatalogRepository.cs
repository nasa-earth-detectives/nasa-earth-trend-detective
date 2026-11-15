using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Catalog of actually loaded observed datasets. A variable without provenance has no real data:
/// the API declares this explicitly rather than silently populating invented series.
/// </summary>
public interface IDatasetCatalogRepository
{
    Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<DatasetProvenance?> GetAsync(ClimateVariable variable, CancellationToken cancellationToken = default);
}
