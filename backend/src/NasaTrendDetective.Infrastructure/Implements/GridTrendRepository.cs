using System.Data;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Annual series for all cells of a variable in a single query: DuckDB aggregates months
/// to years, and .NET groups rows already ordered by cell (single pass, without dictionaries).
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

        var cells = new List<CellAnnualSeries>();
        List<AnnualObservation>? years = null;
        double currentLat = 0;
        double currentLng = 0;

        await _repository.StreamQueryAsync(Sql, record =>
        {
            var latitude = record.GetDouble(0);
            var longitude = record.GetDouble(1);
            var anomaly = record.IsDBNull(4) ? (double?)null : record.GetDouble(4);
            var value = record.IsDBNull(3) ? anomaly ?? 0.0 : record.GetDouble(3);
            var observation = new AnnualObservation(record.GetInt32(2), value, anomaly);

            if (years is null)
            {
                currentLat = latitude;
                currentLng = longitude;
                years = new List<AnnualObservation>();
            }
            else if (latitude != currentLat || longitude != currentLng)
            {
                cells.Add(new CellAnnualSeries(currentLat, currentLng, years));
                currentLat = latitude;
                currentLng = longitude;
                years = new List<AnnualObservation>();
            }

            years.Add(observation);
        }, parameters, cancellationToken).ConfigureAwait(false);

        if (years is not null)
        {
            cells.Add(new CellAnnualSeries(currentLat, currentLng, years));
        }

        return cells;
    }
}
