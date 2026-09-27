using System.Globalization;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Implements;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

/// <summary>
/// Contexto de prueba: DuckDB en memoria, directorio temporal para CSV/Parquet y normalizador real.
/// </summary>
internal sealed class GridNormalizerTestContext : IDisposable
{
    public GridNormalizerTestContext(GridNormalizationOptions? options = null)
    {
        WorkDirectory = DuckDbTestHelpers.CreateTempDirectory();
        Factory = DuckDbTestHelpers.CreateFactory();
        Options = options ?? new GridNormalizationOptions();
        Options.OutputDirectory = Path.Combine(WorkDirectory, "normalized");
        Normalizer = new SpatialGridNormalizer(
            Factory,
            [new CsvRawDatasetReader()],
            Microsoft.Extensions.Options.Options.Create(Options));
    }

    public string WorkDirectory { get; }

    public DuckDbConnectionFactory Factory { get; }

    public GridNormalizationOptions Options { get; }

    public ISpatialGridNormalizer Normalizer { get; }

    public static string Quote(string path) => $"'{path.Replace("'", "''")}'";

    public string WriteCsv(string fileName, params string[] lines)
    {
        var path = Path.Combine(WorkDirectory, fileName);
        File.WriteAllLines(path, lines);
        return path;
    }

    public async Task<List<object?[]>> QueryAsync(string sql)
    {
        await using var connection = await Factory.CreateOpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<object?[]>();
        while (await reader.ReadAsync())
        {
            var row = new object?[reader.FieldCount];
            for (var i = 0; i < reader.FieldCount; i++)
            {
                row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }

            rows.Add(row);
        }

        return rows;
    }

    /// <summary>
    /// Devuelve (latitude, longitude) del Parquet como decimales, en el orden físico del archivo.
    /// </summary>
    public async Task<List<(decimal Lat, decimal Lon)>> ReadCoordinatesAsync(string parquetPath)
    {
        var rows = await QueryAsync($"SELECT latitude, longitude FROM read_parquet({Quote(parquetPath)})");
        return rows
            .Select(r => (
                Convert.ToDecimal(r[0], CultureInfo.InvariantCulture),
                Convert.ToDecimal(r[1], CultureInfo.InvariantCulture)))
            .ToList();
    }

    public void Dispose()
    {
        Factory.Dispose();
        DuckDbTestHelpers.TryDeleteDirectory(WorkDirectory);
    }
}
