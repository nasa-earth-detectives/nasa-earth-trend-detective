using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Mann-Kendall con preblanqueo iterativo (Zhang et al., 2000; Wang y Swail, 2001). El test clásico
/// supone que cada año es independiente del anterior. Con persistencia (a un año seco le suele seguir
/// otro seco) toma las rachas por tendencia y da falsos positivos. Aquí se estiman a la vez la
/// tendencia y la autocorrelación r1, se resta a cada año lo que hereda del anterior,
/// w(t) = (x(t) − r1·x(t−1)) / (1 − r1), y el test se repite sobre w.
///
/// Por qué éste: se midieron cinco métodos con 2.000 series simuladas por caso (AR(1) con φ de 0 a
/// 0,7; 25 y 45 años; nivel nominal 5 %). Falsos positivos sin tendencia: clásico de 4 a 38 %;
/// preblanqueo sin tendencia de Yue (2002) de 5 a 50 %; éste de 3,5 a 19 %. No los elimina: los deja
/// en torno a la mitad. El preblanqueo simple de von Storch (1995) sí queda cerca del 5 %, pero borra
/// tendencias reales (detecta el 55 % de una tendencia fuerte con φ = 0,5 y 45 años; éste, el 99,9 %),
/// porque mide r1 sin quitar antes la tendencia.
///
/// Descartado: corregir además el sesgo de r1 en series cortas, (n·r1 + 2)/(n − 4). En la simulación
/// bajaba los falsos positivos a 3-9 %, pero con las series reales de 21 a 26 años la iteración se iba
/// al tope de r1 y borraba señales nítidas (el agotamiento de acuíferos del norte de India, GRACE,
/// pasaba de p = 7·10⁻⁸ a p = 0,89).
/// </summary>
public static class PrewhiteningTrendTest
{
    /// <summary>Con menos años r1 no se puede estimar con sentido.</summary>
    public const int MinYears = 8;

    /// <summary>Pares de años seguidos mínimos; los huecos de la serie no cuentan.</summary>
    public const int MinConsecutivePairs = 5;

    /// <summary>Por debajo de este r1 la persistencia se da por despreciable y la serie no se toca.</summary>
    public const double NegligibleAutocorrelation = 0.05;

    private const double MaxAutocorrelation = 0.95; // con r1 cerca de 1 la división por (1 − r1) se dispara
    private const int MaxIterations = 50;
    private const double Tolerance = 1e-4;
    private const double NoiseFloor = 1e-12; // fracción de la varianza original por debajo de la cual sólo queda redondeo

    public static PrewhitenedTrendVerdict Calculate(IReadOnlyList<double> values, IReadOnlyList<int> years)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(years);

        var count = values.Count;
        // Sólo cuentan los pares de años seguidos. Tras un hueco (el de 2017-2018 entre GRACE y
        // GRACE-FO, por ejemplo) el dato anterior no es "el año pasado" y no hay herencia que restar.
        var pairs = Enumerable.Range(0, Math.Max(count - 1, 0)).Where(i => years[i + 1] - years[i] == 1).ToArray();
        if (count != years.Count || count < MinYears || pairs.Length < MinConsecutivePairs)
        {
            return PrewhitenedTrendVerdict.Inconclusive;
        }

        var lag1 = Lag1(values, pairs, out var spread);
        if (lag1 < NegligibleAutocorrelation)
        {
            return Verdict(values, lag1);
        }

        lag1 = Math.Min(lag1, MaxAutocorrelation);
        var times = pairs.Select(i => years[i + 1]).ToArray();
        var whitened = Whiten(values, pairs, lag1);
        var slope = MedianSlope(whitened, times);

        for (var iteration = 0; iteration < MaxIterations; iteration++)
        {
            // r1 se mide sobre la serie SIN la tendencia: si no, la propia tendencia lo infla.
            var detrended = values.Select((value, i) => value - slope * years[i]).ToArray();
            var residual = Lag1(detrended, pairs, out var residualSpread);
            if (residualSpread <= NoiseFloor * spread)
            {
                return Verdict(values, 0.0); // recta exacta: quitada la tendencia no queda nada que medir
            }

            var next = Math.Min(residual, MaxAutocorrelation);
            if (next < NegligibleAutocorrelation)
            {
                return Verdict(values, next);
            }

            whitened = Whiten(values, pairs, next);
            var nextSlope = MedianSlope(whitened, times);
            var converged = Math.Abs(next - lag1) <= Tolerance
                && Math.Abs(nextSlope - slope) <= Tolerance * Math.Max(Math.Abs(slope), 1e-12);
            (lag1, slope) = (next, nextSlope);
            if (converged)
            {
                break;
            }
        }

        return Verdict(whitened, lag1);
    }

    private static PrewhitenedTrendVerdict Verdict(IReadOnlyList<double> series, double lag1)
    {
        var mannKendall = MannKendallCalculator.Calculate(series);
        return new PrewhitenedTrendVerdict(lag1, series.Count, mannKendall.ZScore, mannKendall.PValue,
            Math.Abs(mannKendall.ZScore) > MannKendallCalculator.ZCritical95);
    }

    /// <summary>
    /// Autocorrelación de un paso con la media común de la serie. El factor (n − 1)/pares vale 1 sin
    /// huecos (el estimador habitual) y, con huecos, compensa los productos que faltan.
    /// </summary>
    private static double Lag1(IReadOnlyList<double> series, int[] pairs, out double sumOfSquares)
    {
        var mean = series.Average();
        sumOfSquares = series.Sum(value => (value - mean) * (value - mean));
        if (sumOfSquares <= 0.0)
        {
            return 0.0; // serie constante: sin persistencia que medir
        }

        var crossProducts = pairs.Sum(i => (series[i] - mean) * (series[i + 1] - mean));
        return crossProducts / sumOfSquares * (series.Count - 1) / pairs.Length;
    }

    /// <summary>Dividir por (1 − r1) deja la pendiente como estaba; sin ello el preblanqueo la encoge.</summary>
    private static double[] Whiten(IReadOnlyList<double> values, int[] pairs, double lag1) =>
        pairs.Select(i => (values[i + 1] - lag1 * values[i]) / (1.0 - lag1)).ToArray();

    /// <summary>Pendiente de Sen sin redondear: el bucle necesita más de los 6 decimales que publica la API.</summary>
    private static double MedianSlope(double[] series, int[] times)
    {
        var slopes = new List<double>(series.Length * (series.Length - 1) / 2);
        for (var k = 0; k < series.Length - 1; k++)
        {
            for (var j = k + 1; j < series.Length; j++)
            {
                slopes.Add((series[j] - series[k]) / (times[j] - times[k]));
            }
        }

        slopes.Sort();
        var middle = slopes.Count / 2;
        return slopes.Count % 2 == 1 ? slopes[middle] : (slopes[middle - 1] + slopes[middle]) / 2.0;
    }
}
