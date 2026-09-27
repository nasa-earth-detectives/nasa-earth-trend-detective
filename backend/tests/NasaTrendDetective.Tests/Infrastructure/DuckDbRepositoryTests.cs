using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure;

public sealed class DuckDbRepositoryTests : IDisposable
{
    private readonly DuckDbConnectionFactory _factory = DuckDbTestHelpers.CreateFactory();
    private readonly DuckDbRepository _repository;

    public DuckDbRepositoryTests() => _repository = new DuckDbRepository(_factory);

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task IsHealthyAsync_InMemory_ReturnsTrue()
    {
        Assert.True(await _repository.IsHealthyAsync());
    }

    [Fact]
    public async Task GetVersionAsync_ReturnsDuckDbVersion()
    {
        var version = await _repository.GetVersionAsync();

        Assert.StartsWith("v", version);
    }

    [Fact]
    public async Task ExecuteScalarAsync_WithParameters_ConvertsResult()
    {
        var parameters = new Dictionary<string, object?> { ["a"] = 40, ["$b"] = 2 };

        var sum = await _repository.ExecuteScalarAsync<long>("SELECT CAST($a + $b AS BIGINT)", parameters);
        var asDouble = await _repository.ExecuteScalarAsync<double>("SELECT 21 * 2");

        Assert.Equal(42L, sum);
        Assert.Equal(42d, asDouble);
    }

    [Fact]
    public async Task ExecuteScalarAsync_NullResult_ReturnsDefault()
    {
        Assert.Null(await _repository.ExecuteScalarAsync<string>("SELECT NULL"));
        Assert.Null(await _repository.ExecuteScalarAsync<int?>("SELECT NULL::INTEGER"));
    }

    [Fact]
    public async Task ExecuteAndQueryAsync_RoundTripsRows()
    {
        await _repository.ExecuteAsync("CREATE TABLE obs (station VARCHAR, value DOUBLE)");
        var inserted = await _repository.ExecuteAsync(
            "INSERT INTO obs VALUES ($s1, $v1), ($s2, $v2)",
            new Dictionary<string, object?> { ["s1"] = "BOG", ["v1"] = 0.28, ["s2"] = "AMZ", ["v2"] = 0.76 });

        var rows = await _repository.QueryAsync(
            "SELECT station, value FROM obs WHERE value > $min ORDER BY station",
            record => (Station: record.GetString(0), Value: record.GetDouble(1)),
            new Dictionary<string, object?> { ["min"] = 0.1 });

        Assert.Equal(2, inserted);
        Assert.Equal([("AMZ", 0.76), ("BOG", 0.28)], rows);
    }

    [Fact]
    public async Task ConcurrentOperations_UseIsolatedConnections()
    {
        var tasks = Enumerable.Range(1, 16)
            .Select(i => _repository.ExecuteScalarAsync<int>(
                "SELECT $n * 2", new Dictionary<string, object?> { ["n"] = i }));

        int[] results = await Task.WhenAll(tasks);

        Assert.Equal(Enumerable.Range(1, 16).Select(i => i * 2).ToArray(), results);
    }

    [Fact]
    public async Task ExecuteParquetIngestAsync_LoadsParquetIntoTable()
    {
        var root = DuckDbTestHelpers.CreateTempDirectory();
        try
        {
            var parquet = Path.Combine(root, "fixture.parquet").Replace(Path.DirectorySeparatorChar, '/');
            await _repository.ExecuteAsync(
                $"COPY (SELECT * FROM range(5) t(id)) TO '{parquet}' (FORMAT parquet)");

            await _repository.ExecuteParquetIngestAsync(parquet, "gistemp_sample");

            Assert.Equal(5L, await _repository.ExecuteScalarAsync<long>("SELECT count(*) FROM gistemp_sample"));
        }
        finally
        {
            DuckDbTestHelpers.TryDeleteDirectory(root);
        }
    }

    [Theory]
    [InlineData("drop table x;")]
    [InlineData("1abc")]
    [InlineData("name\"quote")]
    [InlineData("")]
    public async Task ExecuteParquetIngestAsync_InvalidTableName_Throws(string tableName)
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _repository.ExecuteParquetIngestAsync("file.parquet", tableName));
    }

    [Fact]
    public async Task QueryAsync_CancelledToken_Throws()
    {
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => _repository.QueryAsync("SELECT 1", r => r.GetInt32(0), null, cts.Token));
    }
}
