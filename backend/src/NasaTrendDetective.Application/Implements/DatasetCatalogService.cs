using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

public class DatasetCatalogService : IDatasetCatalogService
{
    private readonly IDatasetCatalogRepository _repository;
    private readonly IDatasetSeedState? _seedState;

    public DatasetCatalogService(IDatasetCatalogRepository repository, IDatasetSeedState? seedState = null)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _seedState = seedState;
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
                // "loading" tells the client to wait and ask again instead of concluding there is no data.
                Status = loaded.ContainsKey(variable) ? DatasetStatusDto.Observed
                    : _seedState is { IsCompleted: false } ? DatasetStatusDto.Loading : DatasetStatusDto.Unavailable,
                Provenance = loaded.GetValueOrDefault(variable)
            })
            .ToList();
    }
}
