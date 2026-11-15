namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// Median without a full sort. Sen's slope is the median of n(n-1)/2 pairwise slopes; sorting them
/// costs O(m log m), and the trend grid needs that median for thousands of cells (several times per
/// cell while prewhitening iterates). Quickselect finds it in O(m) and returns exactly the same
/// value: measured on 16,200 cells x 45 years, prewhitening alone was 70 % of the grid statistics.
/// </summary>
public static class OrderStatistics
{
    /// <summary>
    /// Unrounded Sen's slope: median of (x[j] - x[k]) / (t[j] - t[k]) over every pair with distinct
    /// times. <paramref name="buffer"/> must hold n(n-1)/2 items and is overwritten.
    /// </summary>
    public static double MedianPairwiseSlope(double[] values, int[] times, int count, double[] buffer)
    {
        var slopes = 0;
        for (var k = 0; k < count - 1; k++)
        {
            for (var j = k + 1; j < count; j++)
            {
                var elapsed = times[j] - times[k];
                if (elapsed != 0)
                {
                    buffer[slopes++] = (values[j] - values[k]) / elapsed;
                }
            }
        }

        return Median(buffer, slopes);
    }

    /// <summary>Median of the first <paramref name="count"/> items; reorders the buffer. 0 if empty.</summary>
    public static double Median(double[] buffer, int count)
    {
        if (count == 0)
        {
            return 0.0;
        }

        var middle = count / 2;
        var upper = Select(buffer, count, middle);
        if ((count & 1) == 1)
        {
            return upper;
        }

        // After selection everything left of `middle` is <= upper, so the lower middle is its maximum.
        var lower = buffer[0];
        for (var i = 1; i < middle; i++)
        {
            if (buffer[i] > lower)
            {
                lower = buffer[i];
            }
        }

        return (lower + upper) / 2.0;
    }

    /// <summary>Hoare quickselect with a median-of-three pivot: k-th smallest of the first items.</summary>
    private static double Select(double[] items, int count, int k)
    {
        var left = 0;
        var right = count - 1;
        while (left < right)
        {
            var mid = left + ((right - left) >> 1);
            if (items[mid] < items[left]) (items[left], items[mid]) = (items[mid], items[left]);
            if (items[right] < items[left]) (items[left], items[right]) = (items[right], items[left]);
            if (items[right] < items[mid]) (items[mid], items[right]) = (items[right], items[mid]);
            var pivot = items[mid];

            var i = left;
            var j = right;
            while (i <= j)
            {
                while (items[i] < pivot) i++;
                while (items[j] > pivot) j--;
                if (i <= j)
                {
                    (items[i], items[j]) = (items[j], items[i]);
                    i++;
                    j--;
                }
            }

            if (k <= j) right = j;
            else if (k >= i) left = i;
            else return items[k];
        }

        return items[k];
    }
}
