using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// fact_annual_cell: the annual value of each cell, derived from fact_climate_observations when a
/// dataset is loaded.
///
/// Why it exists: a trend grid needs one value per cell and year. Monthly datasets (GISTEMP is 5.1
/// million facts) were reduced to years inside every grid request, and that aggregation sits at the
/// edge of the 110 MB DuckDB is allowed on the host. Measured in a 512 MB container: the query failed
/// with "Out of Memory Error ... 103.5 MiB/104.9 MiB used", and from then on every query failed the same
/// way until the process was restarted. Reduced once, when the dataset is loaded (at image build), the
/// request only reads rows that are already annual.
///
/// One year per statement, so the reduction itself never holds more than one year of one variable.
/// Rows are the same the grid query used to compute on the fly: same grouping, same filter.
/// </summary>
internal static class AnnualCellTable
{
    public const string Count = "SELECT count(*) FROM fact_annual_cell WHERE variable_id = $varId";

    public const string Delete = "DELETE FROM fact_annual_cell WHERE variable_id = $varId";

    private const string Years =
        "SELECT DISTINCT CAST(year AS INTEGER) FROM fact_climate_observations WHERE variable_id = $varId ORDER BY 1";

    private const string InsertYear = """
        INSERT INTO fact_annual_cell
            (variable_id, latitude, longitude, year, average_value, average_anomaly, month_count)
        SELECT variable_id, latitude, longitude, year,
               avg(observation_value), avg(anomaly_value), CAST(count(*) AS SMALLINT)
        FROM fact_climate_observations
        WHERE variable_id = $varId AND year = $year
          AND COALESCE(anomaly_value, observation_value) IS NOT NULL
        GROUP BY variable_id, latitude, longitude, year
        """;

    /// <summary>Rebuilds the annual rows of one variable from its facts. Returns the rows written.</summary>
    public static async Task<long> RefreshAsync(IDuckDbRepository repository, int variableId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(repository);
        var variable = new Dictionary<string, object?> { ["varId"] = variableId };
        await repository.ExecuteAsync(Delete, variable, ct).ConfigureAwait(false);

        var years = await repository.QueryAsync(Years, record => record.GetInt32(0), variable, ct).ConfigureAwait(false);
        foreach (var year in years)
        {
            await repository.ExecuteAsync(
                    InsertYear, new Dictionary<string, object?> { ["varId"] = variableId, ["year"] = year }, ct)
                .ConfigureAwait(false);
        }

        return await repository.ExecuteScalarAsync<long>(Count, variable, ct).ConfigureAwait(false);
    }
}
