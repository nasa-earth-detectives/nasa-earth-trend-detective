using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Interfaces;

/// <summary>
/// Catálogo de datasets observados realmente cargados. Una variable sin procedencia no tiene datos
/// reales: la API lo declara en vez de rellenar con series inventadas sin avisar.
/// </summary>
public interface IDatasetCatalogRepository
{
    Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<DatasetProvenance?> GetAsync(ClimateVariable variable, CancellationToken cancellationToken = default);
}
