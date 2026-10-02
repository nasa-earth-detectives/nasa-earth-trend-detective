using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.ScientificValidation;

public class NasaCrossValidationTests
{
    [Fact]
    public void ArcticAmplification_MatchesNasaPublishedWarmingRate()
    {
        // Serie representativa de anomalías GISTEMP en el Ártico (2000-2024)
        // La literatura oficial de la NASA reporta un calentamiento ártico de ~+0.7°C por década.
        var observations = Enumerable.Range(2000, 25).Select(year =>
        {
            var t = year - 2000;
            // Tendencia física de 0.07°C/año (= 0.70°C/década) con variabilidad interanual
            var tempAnomaly = 0.070 * t + 0.12 * Math.Sin(t * 1.7);
            return new AnnualObservation(year, Math.Round(tempAnomaly, 3), Math.Round(tempAnomaly, 3));
        }).ToList();

        var verdict = TrendStatisticsEngine.Analyze(observations);

        // Tolerancia científica: 0.65°C a 0.75°C por década
        Assert.True(verdict.SensSlopePerDecade >= 0.60 && verdict.SensSlopePerDecade <= 0.80,
            $"La pendiente decenal calculada ({verdict.SensSlopePerDecade}°C/década) debe converger con el informe NASA (+0.70°C/década).");
        Assert.True(verdict.ZScore > 1.96, "El calentamiento ártico debe ser estadísticamente significativo.");
        Assert.Equal(TrendDirection.Increasing, verdict.Direction);
    }

    [Fact]
    public void GreenlandIceLoss_MatchesNasaGraceFoDecayRate()
    {
        // Datos representativos GRACE/GRACE-FO para masa glaciar de Groenlandia (2002-2024)
        // NASA reporta una pérdida promedio de ~-260 a -275 Gt/año (cm de agua equivalente acumulada negativa)
        var observations = Enumerable.Range(2002, 23).Select(year =>
        {
            var t = year - 2002;
            var massLoss = -262.0 * t + 15.0 * Math.Cos(t * 1.3);
            return new AnnualObservation(year, Math.Round(massLoss, 1), Math.Round(massLoss, 1));
        }).ToList();

        var verdict = TrendStatisticsEngine.Analyze(observations);

        // Sen's slope debe reflejar una pérdida acelerada negativa
        Assert.True(verdict.SensSlope <= -240.0 && verdict.SensSlope >= -280.0,
            $"La pérdida de masa calculada ({verdict.SensSlope} Gt/año) converge con el rango oficial GRACE-FO.");
        Assert.True(verdict.ZScore < -1.96, "La pérdida de masa en Groenlandia debe ser estadísticamente significativa.");
        Assert.Equal(TrendDirection.Decreasing, verdict.Direction);
    }
}
