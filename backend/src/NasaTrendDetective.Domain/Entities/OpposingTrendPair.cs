namespace NasaTrendDetective.Domain.Entities;

public sealed record OpposingTrendPair(
    string PairId,
    string DriverProcess,
    RegionalTrendSummary IncreasingRegion,
    RegionalTrendSummary DecreasingRegion,
    double DivergenceIndex,
    string ScientificNotes);
