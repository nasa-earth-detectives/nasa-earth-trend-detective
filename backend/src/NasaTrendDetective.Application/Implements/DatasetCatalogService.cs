using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

public class DatasetCatalogService : IDatasetCatalogService
{
    private readonly IDatasetCatalogRepository _repository;

    public DatasetCatalogService(IDatasetCatalogRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<IReadOnlyList<DatasetStatusDto>> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        var loaded = (await _repository.GetAllAsync(cancellationToken).ConfigureAwait(false))
            .ToDictionary(p => p.Variable);

        return Enum.GetValues<ClimateVariable>()
            .Select(variable => new DatasetStatusDto
            {
                Variable = variable,
                Code = variable.ToString(),
                Status = loaded.ContainsKey(variable) ? DatasetStatusDto.Observed : DatasetStatusDto.Synthetic,
                Provenance = loaded.GetValueOrDefault(variable)
            })
            .ToList();
    }
}
