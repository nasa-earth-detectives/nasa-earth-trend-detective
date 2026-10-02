using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure.Etl;

/// <summary>
/// Contexto de prueba del importador: DuckDB en memoria con el esquema estrella inicializado y un
/// directorio temporal donde se generan Parquet sintéticos con COPY ... TO (sin archivos reales).
/// </summary>
internal sealed class ParquetImportTestContext : IDisposable
{
    /// <summary>
    /// SELECT canónico de ejemplo: 2 variables x 2 celdas x 3 meses de 2020 = 12 filas.
    /// </summary>
    public const string CanonicalSampleSql = """
        SELECT CAST(v AS TINYINT) AS variable_id,
               CAST(lat AS DECIMAL(5,2)) AS latitude,
               CAST(-74.08 AS DECIMAL(5,2)) AS longitude,
               make_timestamp(2020, m, 1, 0, 0, 0) AS "timestamp",
               CAST(v * 10 + m AS DOUBLE) AS value,
               CAST(m / 10 AS DOUBLE) AS anomaly
        FROM range(1, 3) t1(v), (VALUES (4.61), (-4.61)) t2(lat), range(1, 4) t3(m)
        """;

    private ParquetImportTestContext()
    {
        WorkDirectory = DuckDbTestHelpers.CreateTempDirectory();
        Factory = DuckDbTestHelpers.CreateFactory();
        Repository = new DuckDbRepository(Factory);
    }

    public string WorkDirectory { get; }

    public DuckDbConnectionFactory Factory { get; }

    public DuckDbRepository Repository { get; }

    public string Glob => $"{WorkDirectory.Replace('\\', '/')}/*.parquet";

    public static async Task<ParquetImportTestContext> CreateAsync()
    {
        var context = new ParquetImportTestContext();
        await new DuckDbSchemaInitializer(context.Factory).InitializeAsync();
        return context;
    }

    public async Task<string> WriteParquetAsync(string fileName, string selectSql)
    {
        var path = Path.Combine(WorkDirectory, fileName).Replace('\\', '/');
        await Repository.ExecuteAsync($"COPY ({selectSql}) TO '{path}' (FORMAT PARQUET, COMPRESSION SNAPPY)");
        return path;
    }

    public Task<long> CountAsync(string table) =>
        Repository.ExecuteScalarAsync<long>($"SELECT count(*) FROM {table}");

    public void Dispose()
    {
        Factory.Dispose();
        DuckDbTestHelpers.TryDeleteDirectory(WorkDirectory);
    }
}
