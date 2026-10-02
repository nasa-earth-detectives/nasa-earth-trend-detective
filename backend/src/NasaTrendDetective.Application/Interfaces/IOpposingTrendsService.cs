using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Interfaces;

public interface IOpposingTrendsService
{
    Task<IReadOnlyList<OpposingTrendPair>> GetPredefinedPairsAsync(CancellationToken cancellationToken = default);
    Task<OpposingTrendPair?> GetPairByIdAsync(string pairId, CancellationToken cancellationToken = default);
    OpposingTrendPair EvaluatePair(RegionalTrendSummary regionA, RegionalTrendSummary regionB, string driverProcess, string notes);
}
