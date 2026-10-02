using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

public class OpposingTrendsService : IOpposingTrendsService
{
    public Task<IReadOnlyList<OpposingTrendPair>> GetPredefinedPairsAsync(CancellationToken cancellationToken = default)
    {
        var pairs = new List<OpposingTrendPair>
        {
            BuildArcticAtlanticPair(),
            BuildAmazonChinaPair(),
            BuildGreenlandAntarcticaPair()
        };

        return Task.FromResult<IReadOnlyList<OpposingTrendPair>>(pairs);
    }

    public async Task<OpposingTrendPair?> GetPairByIdAsync(string pairId, CancellationToken cancellationToken = default)
    {
        var all = await GetPredefinedPairsAsync(cancellationToken);
        return all.FirstOrDefault(p => string.Equals(p.PairId, pairId, StringComparison.OrdinalIgnoreCase));
    }

    public OpposingTrendPair EvaluatePair(
        RegionalTrendSummary regionA,
        RegionalTrendSummary regionB,
        string driverProcess,
        string notes)
    {
        ArgumentNullException.ThrowIfNull(regionA);
        ArgumentNullException.ThrowIfNull(regionB);

        var (increasing, decreasing) = regionA.Stats.SensSlope >= regionB.Stats.SensSlope
            ? (regionA, regionB)
            : (regionB, regionA);

        var divergenceIndex = Math.Round(
            Math.Abs(increasing.Stats.ZScore - decreasing.Stats.ZScore) *
            (1.0 + Math.Abs(increasing.Stats.SensSlope - decreasing.Stats.SensSlope)),
            3);

        var pairId = $"dynamic-{regionA.RegionId}-{regionB.RegionId}";

        return new OpposingTrendPair(
            pairId,
            driverProcess,
            increasing,
            decreasing,
            divergenceIndex,
            notes);
    }

    private static OpposingTrendPair BuildArcticAtlanticPair()
    {
        var years = Enumerable.Range(2000, 25).ToList();
        var arcticObs = years.Select(y => new AnnualObservation(y, Math.Round(0.065 * (y - 2000) + 0.15, 3), Math.Round(0.07 * (y - 2000) - 0.5, 3))).ToList();
        var atlanticObs = years.Select(y => new AnnualObservation(y, Math.Round(-0.018 * (y - 2000) + 0.10, 3), Math.Round(-0.02 * (y - 2000) + 0.2, 3))).ToList();

        var arcticStats = TrendStatisticsEngine.Analyze(arcticObs);
        var atlanticStats = TrendStatisticsEngine.Analyze(atlanticObs);

        var arctic = new RegionalTrendSummary("arctic-polar", "Ártico (Svalbard)", 78.22, 15.63, ClimateVariable.Gistemp, 2000, 2024, arcticObs, arcticStats);
        var atlantic = new RegionalTrendSummary("subpolar-gyre", "Atlántico Norte Subpolar", 55.0, -30.0, ClimateVariable.Gistemp, 2000, 2024, atlanticObs, atlanticStats);

        var divergence = Math.Round(Math.Abs(arcticStats.ZScore - atlanticStats.ZScore), 3);

        return new OpposingTrendPair(
            "arctic-atlantic-thermal",
            "Desaceleración de la AMOC y Amplificación Térmica Ártica",
            arctic,
            atlantic,
            divergence,
            "Calentamiento polar acelerado (+0.7°C/década) en contraste con la 'burbuja de enfriamiento' del Atlántico Norte debida a la desaceleración del transporte meridional de calor.");
    }

    private static OpposingTrendPair BuildAmazonChinaPair()
    {
        var years = Enumerable.Range(2000, 25).ToList();
        var chinaObs = years.Select(y => new AnnualObservation(y, Math.Round(0.0028 * (y - 2000) + 0.62, 3), Math.Round(0.003 * (y - 2000) - 0.03, 3))).ToList();
        var amazonObs = years.Select(y => new AnnualObservation(y, Math.Round(-0.0022 * (y - 2000) + 0.81, 3), Math.Round(-0.0025 * (y - 2000) + 0.04, 3))).ToList();

        var chinaStats = TrendStatisticsEngine.Analyze(chinaObs);
        var amazonStats = TrendStatisticsEngine.Analyze(amazonObs);

        var china = new RegionalTrendSummary("south-china", "Sur de China", 25.0, 115.0, ClimateVariable.ModisNdvi, 2000, 2024, chinaObs, chinaStats);
        var amazon = new RegionalTrendSummary("amazon-basin", "Cuenca Amazónica", -3.46, -62.21, ClimateVariable.ModisNdvi, 2000, 2024, amazonObs, amazonStats);

        var divergence = Math.Round(Math.Abs(chinaStats.ZScore - amazonStats.ZScore), 3);

        return new OpposingTrendPair(
            "amazon-china-ndvi",
            "Reforestación Antropogénica vs Estrés y Fragmentación Tropical",
            china,
            amazon,
            divergence,
            "Reverdecimiento sostenido en el sur de China impulsado por programas de forestación frente a la reducción del dosel vegetal y sequías recurrentes en la Amazonía.");
    }

    private static OpposingTrendPair BuildGreenlandAntarcticaPair()
    {
        var years = Enumerable.Range(2002, 23).ToList();
        var greenlandObs = years.Select(y => new AnnualObservation(y, Math.Round(-260.0 * (y - 2002) - 100.0, 1), Math.Round(-260.0 * (y - 2002), 1))).ToList();
        var antarcticaObs = years.Select(y => new AnnualObservation(y, Math.Round(15.0 * (y - 2002) + 20.0, 1), Math.Round(15.0 * (y - 2002), 1))).ToList();

        var greenlandStats = TrendStatisticsEngine.Analyze(greenlandObs);
        var antarcticaStats = TrendStatisticsEngine.Analyze(antarcticaObs);

        var greenland = new RegionalTrendSummary("greenland-ice", "Manto de Hielo de Groenlandia", 72.0, -40.0, ClimateVariable.GraceMass, 2002, 2024, greenlandObs, greenlandStats);
        var antarctica = new RegionalTrendSummary("east-antarctica", "Meseta Antártica Oriental", -75.0, 100.0, ClimateVariable.GraceMass, 2002, 2024, antarcticaObs, antarcticaStats);

        var divergence = Math.Round(Math.Abs(antarcticaStats.ZScore - greenlandStats.ZScore), 3);

        return new OpposingTrendPair(
            "polar-ice-divergence",
            "Divergencia de Masa Glaciar Polar (GRACE / GRACE-FO)",
            antarctica,
            greenland,
            divergence,
            "Groenlandia registra una pérdida acelerada de masa de ~260 Gt/año por fusión estival y flujo glaciar, en marcado contraste con la estabilidad de la meseta antártica oriental.");
    }
}
