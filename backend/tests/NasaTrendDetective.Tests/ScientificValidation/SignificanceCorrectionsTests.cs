using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Application.Statistics;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.ScientificValidation;

/// <summary>
/// Las dos correcciones de la significancia (2026-11-14). El ajuste de Benjamini-Hochberg se contrasta
/// con SciPy 1.18.1 (`stats.false_discovery_control(p, method="bh")`). El Mann-Kendall con preblanqueo
/// iterativo no tiene una implementación de terceros en Python (la de referencia es el paquete zyp, de
/// R): se contrasta con un prototipo aparte en numpy (`referencia_preblanqueo.py`), cuyo Mann-Kendall
/// y cuya pendiente de Sen sí se comprueban contra pymannkendall 1.4.3 y SciPy. Lo que respalda el
/// método es la simulación de falsos positivos y potencia (`simulacion_prewhitening_iterativo.py`).
/// </summary>
public class SignificanceCorrectionsTests
{
    private static readonly double[] ShortSeries = [1.2, 0.8, 1.9, 2.4, 1.7, 3.1, 2.6, 3.9, 3.3, 4.8, 4.1, 5.5];
    private static readonly double[] FlatSeries = [2.0, 3.1, 1.4, 2.8, 2.2, 3.4, 1.9, 2.5, 3.0, 1.6, 2.7, 2.3];

    // Real: anomalía anual de precipitación de MERRA-2 (NASA POWER) en la celda 5° S, 61° O, 1981-2025.
    private static readonly double[] AmazonPrecipitation =
    [
        0.777, 1.134, -0.161, 0.534, 0.366, 1.17, 0.784, -0.154, 0.334, -0.556, -0.82, -0.581, 2.047, 0.935, 0.254,
        1.205, -0.372, 0.002, 0.399, 0.318, 0.417, 0.473, -0.319, -0.229, -0.919, 0.506, -0.342, 0.881, 0.901, 0.121,
        -0.064, -0.209, 0.249, -0.159, -1.817, -0.382, -0.346, -1.59, -0.963, 0.405, 2.042, 1.572, -0.533, -1.192, -0.858,
    ];

    // Simulada: proceso AR(1) con φ = 0,7 y SIN tendencia (numpy, semilla 12). Tiene rachas, no tendencia.
    private static readonly double[] PersistentWithoutTrend =
    [
        0, 1.046, 1.474, 1.756, 2.848, 0.788, -0.075, -1.373, -1.069, 0.25, 0.153, 0.603, -1.489, -0.895, -1.533, 0.702,
        1.378, 1.914, 1.282, 1.51, 1.715, 0.856, 0.102, -0.043, -0.636, -1.039, -1.011, -1.436, -0.239, -1.763, -0.411,
        -0.913, -1.185, -2.18, -1.671, -1.417, -0.8, -1.094, -0.672, 1.349,
    ];

    // Simulada: el mismo tipo de persistencia (φ = 0,6) MÁS una tendencia real de +0,08 por año (semilla 3).
    private static readonly double[] PersistentWithTrend =
    [
        0, -2.476, -0.955, -0.997, -0.875, -0.532, -2.099, -1.22, -1.293, 2.883, 2.324, 1.442, 1.016, 0.405, -0.316,
        -0.052, 1.011, 0.96, 2.158, 1.751, 1.763, 3.323, 3.291, 2.253, 1.985, 2.58, 4.363, 3.26, 2.657, 3.572, 2.265,
        2.107, 3.219, 3.616, 3.397, 3.876, 0.698, 2.672, 1.907, 0.772, 2.068, 3.301, 2.928, 2.104, 2.745,
    ];

    private static readonly double[] RawPValues =
        [0.324, 0.0004, 1, 0.0298, 0.0095, 0.6528, 0.0459, 0.0019, 0.5719, 0.0201, 0.759, 0.0278, 0.4262, 0.0344];

    private static readonly double[] SciPyAdjusted =
    [
        0.504, 0.0056, 1.0, 0.0688, 0.044333333, 0.7616, 0.080325, 0.0133, 0.727872727, 0.0688, 0.817384615, 0.0688,
        0.59668, 0.0688,
    ];

    // Serie, r1 final, tamaño tras el preblanqueo, Z, valor p y si sigue siendo significativa.
    public static TheoryData<string, double, int, double, double, bool> PrewhiteningReferences => new()
    {
        // r1 negativo: sin persistencia que descontar, el veredicto es el clásico con la serie entera.
        { "short", -0.573383884, 12, 3.634345051, 2.786876842e-04, true },
        { "flat", -0.690176863, 12, 0.0, 1.0, false },
        { "amazon", 0.297712306, 44, -1.689081804, 9.120375438e-02, false },
        { "persistent", 0.538346874, 39, -1.766143390, 7.737179552e-02, false },
        { "persistent-trend", 0.488439610, 44, 3.853533936, 1.164251180e-04, true },
    };

    [Theory]
    [MemberData(nameof(PrewhiteningReferences))]
    public void PrewhitenedMannKendall_MatchesTheReferencePrototype(
        string series, double lag1, int sampleSize, double z, double pValue, bool significant)
    {
        var prewhitened = TrendStatisticsEngine.Analyze(Observations(series)).Prewhitened;

        Assert.Equal(lag1, prewhitened.Lag1Autocorrelation, precision: 6);
        Assert.Equal(sampleSize, prewhitened.SampleSize);
        Assert.Equal(z, prewhitened.ZScore, precision: 6);
        // Tolerancia absoluta: la normal del backend es una aproximación con error del orden de 1e-7.
        Assert.InRange(prewhitened.PValue, pValue - 1e-6, pValue + 1e-6);
        Assert.Equal(significant, prewhitened.IsSignificant);
    }

    [Fact]
    public void PersistenceOnTopOfARealTrend_StaysSignificant()
    {
        // Lo que el preblanqueo simple hace mal: aquí la tendencia existe y tiene que sobrevivir.
        var verdict = TrendStatisticsEngine.Analyze(Observations("persistent-trend"));

        Assert.Equal(4.587907968, verdict.ZScore, precision: 6);
        Assert.True(verdict.IsSignificant);
        Assert.True(verdict.Prewhitened.IsSignificant);
        Assert.True(Math.Abs(verdict.Prewhitened.ZScore) < Math.Abs(verdict.ZScore));
    }

    [Fact]
    public void PersistenceWithoutTrend_FoolsTheClassicTestButNotThePrewhitenedOne()
    {
        var verdict = TrendStatisticsEngine.Analyze(Observations("persistent"));

        // pymannkendall.original_test: z = -2,877805536, p = 0,004.
        Assert.Equal(-2.877805536, verdict.ZScore, precision: 6);
        Assert.True(verdict.IsSignificant);
        Assert.False(verdict.Prewhitened.IsSignificant);
    }

    [Fact]
    public void RealAmazonSeries_ItsDeclineDoesNotSurviveThePersistenceCorrection()
    {
        // Lo que hay que contar en la demo: el descenso de lluvia de esta celda pasa el test clásico
        // (p = 0,016) pero no el preblanqueo (p = 0,09). No se puede presentar como tendencia sólida.
        var verdict = TrendStatisticsEngine.Analyze(Observations("amazon"));

        Assert.True(verdict.IsSignificant);
        Assert.False(verdict.Prewhitened.IsSignificant);
    }

    [Fact]
    public void GapInTheYears_IsNotBridgedByThePrewhitening()
    {
        // La serie de la Amazonía sin 2017 ni 2018, como le pasa a GRACE: quedan 43 años y 41 pares de
        // años seguidos (el salto de 2016 a 2019 no cuenta). Referencia: el mismo prototipo.
        var observations = Observations("amazon").Where(o => o.Year is not (2017 or 2018)).ToList();

        var prewhitened = TrendStatisticsEngine.Analyze(observations).Prewhitened;

        Assert.Equal(41, prewhitened.SampleSize);
        Assert.Equal(0.262504354, prewhitened.Lag1Autocorrelation, precision: 6);
        Assert.Equal(-1.246745132, prewhitened.ZScore, precision: 6);
        Assert.InRange(prewhitened.PValue, 2.124909648e-01 - 1e-6, 2.124909648e-01 + 1e-6);
    }

    [Fact]
    public void TooShortOrConstantSeries_IsInconclusiveInsteadOfThrowing()
    {
        Assert.Equal(PrewhitenedTrendVerdict.Inconclusive, PrewhiteningTrendTest.Calculate([1.0, 2.0, 3.0], [2000, 2001, 2002]));
        // Ningún par de años seguidos: no hay cómo estimar la persistencia.
        var everyOtherYear = Enumerable.Range(0, 10).Select(index => 2000 + 2 * index).ToList();
        Assert.Equal(PrewhitenedTrendVerdict.Inconclusive,
            PrewhiteningTrendTest.Calculate(everyOtherYear.Select(year => year * 0.5).ToList(), everyOtherYear));

        // Constante, o una recta exacta: nada que descontar, queda el veredicto clásico.
        var years = Enumerable.Range(2000, 10).ToList();
        Assert.False(PrewhiteningTrendTest.Calculate(years.Select(_ => 4.0).ToList(), years).IsSignificant);
        var line = PrewhiteningTrendTest.Calculate(years.Select(year => 0.5 * year).ToList(), years);
        Assert.True(line.IsSignificant);
        Assert.Equal(10, line.SampleSize);
    }

    [Fact]
    public void BenjaminiHochberg_AdjustedPValuesMatchSciPy()
    {
        var adjusted = BenjaminiHochberg.Adjust(RawPValues);

        Assert.Equal(SciPyAdjusted.Length, adjusted.Length);
        for (var index = 0; index < adjusted.Length; index++)
        {
            Assert.Equal(SciPyAdjusted[index], adjusted[index], precision: 9);
        }
    }

    [Fact]
    public void BenjaminiHochberg_EightUncorrectedFindingsBecomeThree()
    {
        var adjusted = BenjaminiHochberg.Adjust(RawPValues);

        Assert.Equal(8, RawPValues.Count(p => p < 0.05));
        Assert.Equal(3, adjusted.Count(q => q <= BenjaminiHochberg.DefaultFalseDiscoveryRate));
    }

    [Fact]
    public void BenjaminiHochberg_WhenNothingIsHappening_FlagsNothing()
    {
        // Mil valores p repartidos por igual entre 0 y 1: lo que se espera si ninguna celda cambia.
        var uniform = Enumerable.Range(0, 1000).Select(index => (index + 0.5) / 1000.0).ToList();

        var adjusted = BenjaminiHochberg.Adjust(uniform);

        Assert.Equal(50, uniform.Count(p => p < 0.05));
        Assert.Equal(0, adjusted.Count(q => q <= BenjaminiHochberg.DefaultFalseDiscoveryRate));
        Assert.All(adjusted.Zip(uniform), pair => Assert.InRange(pair.First, pair.Second, 1.0));
        Assert.Empty(BenjaminiHochberg.Adjust([]));
    }

    [Fact]
    public async Task GridTrendService_ReportsHowManyCellsSurviveEachCorrection()
    {
        // 20 celdas con tendencia clara y 380 de puro ruido (semilla fija): un mapa donde casi nada cambia.
        var random = new Random(20261114);
        var cells = Enumerable.Range(0, 400).Select(index => new CellAnnualSeries(
            Latitude: index / 20, Longitude: index % 20,
            Years: Enumerable.Range(1981, 45)
                .Select(year => new AnnualObservation(year, (index < 20 ? 0.12 * (year - 1981) : 0.0) + Gaussian(random)))
                .ToList())).ToList();
        var service = new GridTrendService(new FakeGrid(cells), new FakeCatalog());

        var result = await service.AnalyzeGridAsync(
            new GridTrendQueryDto { Variable = ClimateVariable.Merra2Temperature, StartYear = 1981, EndYear = 2025 });

        Assert.NotNull(result);
        var noise = result.Cells.Where(cell => cell.Latitude >= 1).ToList();
        Assert.Equal(BenjaminiHochberg.DefaultFalseDiscoveryRate, result.FalseDiscoveryRate);
        Assert.Equal(result.Cells.Count(cell => cell.IsSignificant), result.SignificantCells);
        Assert.Equal(result.Cells.Count(cell => cell.IsSignificantCorrected), result.CorrectedSignificantCells);
        Assert.True(result.CorrectedSignificantCells <= result.PrewhitenedSignificantCells);
        // Las 20 tendencias reales sobreviven a las dos correcciones.
        Assert.All(result.Cells.Where(cell => cell.Latitude < 1), cell => Assert.True(cell.IsSignificantCorrected));
        // El ruido cuela falsos hallazgos sin corregir, y casi ninguno después.
        Assert.InRange(noise.Count(cell => cell.IsSignificant), 10, 30);
        Assert.InRange(noise.Count(cell => cell.IsSignificantCorrected), 0, 2);
        Assert.All(result.Cells, cell => Assert.InRange(cell.AdjustedPValue, cell.PrewhitenedPValue, 1.0));
    }

    private static double Gaussian(Random random) =>
        Math.Sqrt(-2.0 * Math.Log(1.0 - random.NextDouble())) * Math.Cos(2.0 * Math.PI * random.NextDouble());

    private static double[] Series(string series) => series switch
    {
        "short" => ShortSeries,
        "flat" => FlatSeries,
        "amazon" => AmazonPrecipitation,
        "persistent" => PersistentWithoutTrend,
        _ => PersistentWithTrend,
    };

    private static List<AnnualObservation> Observations(string series) =>
        Series(series).Select((value, index) => new AnnualObservation(1981 + index, value, value)).ToList();

    private sealed class FakeGrid(IReadOnlyList<CellAnnualSeries> cells) : IGridTrendRepository
    {
        public Task<IReadOnlyList<CellAnnualSeries>> GetCellAnnualSeriesAsync(
            ClimateVariable variable, int startYear, int endYear, int minMonthsPerYear,
            CancellationToken cancellationToken = default) => Task.FromResult(cells);
    }

    private sealed class FakeCatalog : IDatasetCatalogRepository
    {
        private static readonly DatasetProvenance Provenance = new(
            ClimateVariable.Merra2Temperature, "prueba", "serie de prueba", "°C", "°C / año", "1991-2020", 2.0,
            "https://example.invalid", "prueba", "0", DateTimeOffset.UnixEpoch, 1981, 2025, "2025-12", false, "prueba", 0,
            DateTimeOffset.UnixEpoch);

        public Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<DatasetProvenance>>([Provenance]);

        public Task<DatasetProvenance?> GetAsync(ClimateVariable variable, CancellationToken cancellationToken = default) =>
            Task.FromResult<DatasetProvenance?>(Provenance);
    }
}
