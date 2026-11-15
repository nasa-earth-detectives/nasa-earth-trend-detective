using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Application.Statistics;

/// <summary>
/// T-test for the slope of a least-squares linear regression. This is the parametric method
/// that the challenge names alongside Mann-Kendall: it answers the same question (is there a trend?) assuming
/// normal residuals, and provides the rate of change with its 95% confidence interval. Having both
/// allows checking whether the verdict depends on the method.
/// </summary>
public static class LinearTrendTest
{
    public const double SignificanceLevel = 0.05;

    public static LinearTrendVerdict Calculate(IReadOnlyList<double> values, IReadOnlyList<int> years)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(years);

        var n = values.Count;
        // With two points the line passes exactly through both: no degrees of freedom remain for error.
        if (n < 3 || years.Count != n)
        {
            return LinearTrendVerdict.Inconclusive;
        }

        var meanX = years.Average();
        var meanY = values.Average();
        double sxx = 0, sxy = 0;
        for (var i = 0; i < n; i++)
        {
            sxx += (years[i] - meanX) * (years[i] - meanX);
            sxy += (years[i] - meanX) * (values[i] - meanY);
        }

        if (sxx <= 0)
        {
            return LinearTrendVerdict.Inconclusive;
        }

        var slope = sxy / sxx;
        var intercept = meanY - slope * meanX;
        double residualSum = 0;
        for (var i = 0; i < n; i++)
        {
            var residual = values[i] - (intercept + slope * years[i]);
            residualSum += residual * residual;
        }

        var degreesOfFreedom = n - 2;
        var standardError = Math.Sqrt(residualSum / degreesOfFreedom / sxx);
        if (standardError <= 0)
        {
            // Perfect fit: an exact line. The trend is true if the slope is non-zero.
            var exact = Math.Round(slope, 6);
            return new LinearTrendVerdict(exact, 0, 0, slope == 0 ? 1 : 0, [exact, exact], slope != 0);
        }

        var t = slope / standardError;
        var pValue = StudentTDistribution.TwoTailedPValue(t, degreesOfFreedom);
        var margin = StudentTDistribution.TwoTailedCriticalValue(SignificanceLevel, degreesOfFreedom) * standardError;
        return new LinearTrendVerdict(
            Math.Round(slope, 6),
            Math.Round(standardError, 6),
            Math.Round(t, 4),
            pValue,
            [Math.Round(slope - margin, 6), Math.Round(slope + margin, 6)],
            pValue < SignificanceLevel);
    }
}
