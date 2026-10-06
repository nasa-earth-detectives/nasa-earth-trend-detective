using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.Implements;

/// <summary>
/// Datos de demostración deterministas para las variables SIN dataset real cargado. Vive en la capa
/// de aplicación para que sea el servicio, que conoce el catálogo, quien decida usarlos y lo declare
/// (Source = "synthetic"); el repositorio solo devuelve lo que hay en DuckDB.
/// </summary>
internal static class SyntheticClimateData
{
    public static IReadOnlyList<AnnualObservation> AnnualSeries(
        ClimateVariable variable, int startYear, int endYear, double lat, double lng)
    {
        var count = Math.Max(1, endYear - startYear + 1);
        var list = new List<AnnualObservation>(count);
        var baseSeed = (int)Math.Abs(lat * 100 + lng * 10 + (int)variable);
        var isArctic = lat > 66.0;

        for (var y = startYear; y <= endYear; y++)
        {
            var t = y - startYear;
            double slope = variable switch
            {
                ClimateVariable.Gistemp => isArctic ? 0.070 : 0.024,
                ClimateVariable.ModisNdvi => 0.0018,
                ClimateVariable.GraceMass => isArctic ? -220.0 : -15.0,
                _ => 2.45 // Oco2 ppm/yr
            };

            var noise = (Math.Sin(baseSeed + t * 1.5) * 0.15) * Math.Abs(slope);
            var val = (t * slope) + noise;
            list.Add(new AnnualObservation(y, Math.Round(val, 4), Math.Round(val, 4)));
        }

        return list;
    }

    public static IReadOnlyList<TrendObservation> GridSnapshot(ClimateVariable variable, int year)
    {
        var points = new[]
        {
            (78.22, 15.63, 0.85, 1.42),   // Ártico
            (55.0, -30.0, -0.22, -0.45),  // Atlántico Norte
            (-3.46, -62.21, 0.72, -0.08), // Amazonía
            (25.0, 115.0, 0.65, 0.12),    // Sur de China
            (72.0, -40.0, -180.0, -210.0),// Groenlandia
            (4.71, -74.07, 1.10, 0.40)    // Bogotá
        };

        return points.Select((p, idx) => new TrendObservation
        {
            Id = $"fb-{year}-{idx}",
            Variable = variable,
            Latitude = p.Item1,
            Longitude = p.Item2,
            Value = p.Item3,
            Anomaly = p.Item4,
            Unit = VariableUnits.For(variable),
            Timestamp = new DateTime(year, 6, 15, 0, 0, 0, DateTimeKind.Utc)
        }).ToList();
    }
}
