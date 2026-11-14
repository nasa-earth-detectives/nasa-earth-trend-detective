namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Control de la tasa de falsos descubrimientos (Benjamini y Hochberg, 1995). Al probar miles de
/// celdas a la vez con p &lt; 0,05, cerca de un 5 % sale "significativo" por puro azar aunque nada
/// cambie. Este ajuste convierte cada valor p en un valor q: aceptando las celdas con q ≤ 0,05 se
/// espera que, como mucho, el 5 % de las aceptadas sea un falso hallazgo.
/// </summary>
public static class BenjaminiHochberg
{
    /// <summary>Tasa de falsos descubrimientos que se tolera en el mapa.</summary>
    public const double DefaultFalseDiscoveryRate = 0.05;

    /// <summary>
    /// Valores p ajustados (valores q), en el mismo orden de entrada. Con los p ordenados de menor a
    /// mayor, q(i) = mínimo, para j ≥ i, de p(j)·m/j. Mismo resultado que
    /// scipy.stats.false_discovery_control(p, method="bh").
    /// </summary>
    public static double[] Adjust(IReadOnlyList<double> pValues)
    {
        ArgumentNullException.ThrowIfNull(pValues);

        var count = pValues.Count;
        var adjusted = new double[count];
        var order = Enumerable.Range(0, count).OrderBy(index => pValues[index]).ToArray();

        // Se recorre del p más grande al más pequeño arrastrando el mínimo: así ningún q queda por
        // encima del q de un p mayor, que es lo que exige el procedimiento escalonado.
        var running = 1.0;
        for (var rank = count; rank >= 1; rank--)
        {
            var index = order[rank - 1];
            running = Math.Min(running, pValues[index] * count / rank);
            adjusted[index] = running;
        }

        return adjusted;
    }
}
