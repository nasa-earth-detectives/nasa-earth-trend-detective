using System.Data;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Series anuales de todas las celdas de una variable en una sola consulta: DuckDB agrega los meses
/// a años y .NET solo agrupa filas ya ordenadas por celda (una pasada, sin diccionarios).
/// </summary>
public sealed class GridTrendRepository : IGridTrendRepository
{
    private const string Sql = """
        SELECT
            CAST(latitude AS DOUBLE) AS lat,
            CAST(longitude AS DOUBLE) AS lng,
            CAST(year AS INTEGER) AS obs_year,
            avg(observation_value) AS avg_val,
            avg(anomaly_value) AS avg_anom
        FROM fact_climate_observations
        WHERE variable_id = $varId AND year BETWEEN $startYear AND $endYear
          AND COALESCE(anomaly_value, observation_value) IS NOT NULL
        GROUP BY latitude, longitude, year
        HAVING count(*) >= $minMonths
        ORDER BY latitude, longitude, year
        """;

    private readonly IDuckDbRepository _repository;

    public GridTrendRepository(IDuckDbRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<IReadOnlyList<CellAnnualSeries>> GetCellAnnualSeriesAsync(
        ClimateVariable variable,
        int startYear,
        int endYear,
        int minMonthsPerYear,
        CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object?>
        {
            ["varId"] = (byte)variable,
            ["startYear"] = startYear,
            ["endYear"] = endYear,
            ["minMonths"] = minMonthsPerYear
        };

        var rows = await _repository.QueryAsync(Sql, MapRow, parameters, cancellationToken).ConfigureAwait(false);

        var cells = new List<CellAnnualSeries>();
        var years = new List<AnnualObservation>();
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            years.Add(row.Observation);
            var isLastOfCell = i == rows.Count - 1
                || rows[i + 1].Latitude != row.Latitude
                || rows[i + 1].Longitude != row.Longitude;
            if (isLastOfCell)
            {
                cells.Add(new CellAnnualSeries(row.Latitude, row.Longitude, years));
                years = new List<AnnualObservation>();
            }
        }

        return cells;
    }

    private static CellYear MapRow(IDataRecord record)
    {
        var anomaly = record.IsDBNull(4) ? (double?)null : record.GetDouble(4);
        var value = record.IsDBNull(3) ? anomaly ?? 0.0 : record.GetDouble(3);
        return new CellYear(record.GetDouble(0), record.GetDouble(1), new AnnualObservation(record.GetInt32(2), value, anomaly));
    }

    private readonly record struct CellYear(double Latitude, double Longitude, AnnualObservation Observation);
}
