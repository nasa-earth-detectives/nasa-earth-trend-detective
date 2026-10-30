using System.Data;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Lee la tabla dataset_provenance que escribe el sembrado (<see cref="Etl.DatasetSeeder"/>).
/// </summary>
public sealed class DatasetCatalogRepository : IDatasetCatalogRepository
{
    private const string SelectColumns = """
        SELECT variable_id, provider, product, unit, trend_unit, baseline, resolution_degrees,
               source_url, source_file, source_sha256, retrieved_at, coverage_start, coverage_end,
               last_month, interim, citation, row_count, loaded_at
        FROM dataset_provenance
        """;

    private readonly IDuckDbRepository _repository;

    public DatasetCatalogRepository(IDuckDbRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public Task<IReadOnlyList<DatasetProvenance>> GetAllAsync(CancellationToken cancellationToken = default) =>
        _repository.QueryAsync($"{SelectColumns} ORDER BY variable_id", Map, null, cancellationToken);

    public async Task<DatasetProvenance?> GetAsync(
        ClimateVariable variable,
        CancellationToken cancellationToken = default)
    {
        var rows = await _repository.QueryAsync(
                $"{SelectColumns} WHERE variable_id = $varId",
                Map,
                new Dictionary<string, object?> { ["varId"] = (byte)variable },
                cancellationToken)
            .ConfigureAwait(false);
        return rows.Count == 0 ? null : rows[0];
    }

    private static DatasetProvenance Map(IDataRecord r) =>
        new(
            (ClimateVariable)Convert.ToInt32(r.GetValue(0), System.Globalization.CultureInfo.InvariantCulture),
            r.GetString(1),
            r.GetString(2),
            r.GetString(3),
            r.GetString(4),
            r.IsDBNull(5) ? null : r.GetString(5),
            r.GetDouble(6),
            r.GetString(7),
            r.GetString(8),
            r.GetString(9),
            ToUtc(r.GetValue(10)),
            Convert.ToInt32(r.GetValue(11), System.Globalization.CultureInfo.InvariantCulture),
            Convert.ToInt32(r.GetValue(12), System.Globalization.CultureInfo.InvariantCulture),
            r.GetString(13),
            r.GetBoolean(14),
            r.GetString(15),
            Convert.ToInt64(r.GetValue(16), System.Globalization.CultureInfo.InvariantCulture),
            ToUtc(r.GetValue(17)));

    /// <summary>Las fechas se guardan como TIMESTAMP en UTC (sin zona): se marcan como UTC al leerlas.</summary>
    private static DateTimeOffset ToUtc(object value) => value switch
    {
        DateTime dateTime => new DateTimeOffset(DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)),
        DateTimeOffset offset => offset.ToUniversalTime(),
        _ => throw new InvalidCastException($"Tipo de fecha inesperado en dataset_provenance: {value.GetType()}")
    };
}
