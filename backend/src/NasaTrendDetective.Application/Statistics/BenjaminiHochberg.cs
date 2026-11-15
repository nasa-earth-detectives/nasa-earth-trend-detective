namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// False discovery rate control (Benjamini and Hochberg, 1995). When testing thousands of cells
/// at once with p &lt; 0.05, roughly 5% appear "significant" by pure chance even when nothing is
/// changing. This adjustment turns each p-value into a q-value: accepting cells with q &lt;= 0.05
/// ensures at most 5% of accepted discoveries are false positives in expectation.
/// </summary>
public static class BenjaminiHochberg
{
    /// <summary>Tolerated false discovery rate across the map.</summary>
    public const double DefaultFalseDiscoveryRate = 0.05;

    /// <summary>
    /// Adjusted p-values (q-values) in the same input order. With p-values sorted ascending,
    /// q(i) = min_{j &gt;= i} (p(j) * m / j). Matches
    /// scipy.stats.false_discovery_control(p, method="bh").
    /// </summary>
    public static double[] Adjust(IReadOnlyList<double> pValues)
    {
        ArgumentNullException.ThrowIfNull(pValues);

        var count = pValues.Count;
        var adjusted = new double[count];
        var order = Enumerable.Range(0, count).OrderBy(index => pValues[index]).ToArray();

        // Walk from largest p-value to smallest while carrying the running minimum so no q-value
        // exceeds the q-value of a larger p-value, as required by the step-up procedure.
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
