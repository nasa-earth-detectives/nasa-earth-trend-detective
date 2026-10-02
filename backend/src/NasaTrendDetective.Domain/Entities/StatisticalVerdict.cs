using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Domain.Entities;

public sealed record StatisticalVerdict(
    double SStatistic,
    double VarianceS,
    double ZScore,
    double PValue,
    double SensSlope,
    double SensSlopePerDecade,
    double[] ConfidenceInterval95,
    TrendDirection Direction,
    TrendSignificance Significance)
{
    public bool IsSignificant => Math.Abs(ZScore) > 1.95996398454 || PValue < 0.05;
}
