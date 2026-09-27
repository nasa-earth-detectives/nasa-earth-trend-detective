using System.Data;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure;

public class DuckDbConnectionFactoryTests
{
    [Theory]
    [InlineData(":memory:")]
    [InlineData(":MEMORY:")]
    [InlineData("")]
    [InlineData("   ")]
    public void BuildConnectionString_InMemoryPaths_UsesMemoryDataSource(string path)
    {
        var options = new DuckDbOptions { DatabasePath = path };

        Assert.True(options.IsInMemory);
        Assert.Equal("Data Source=:memory:", DuckDbConnectionFactory.BuildConnectionString(options));
    }

    [Fact]
    public void BuildConnectionString_FilePath_ResolvesFullPathAndCreatesDirectory()
    {
        var root = DuckDbTestHelpers.CreateTempDirectory();
        try
        {
            var file = Path.Combine(root, "nested", "nasa_trends.duckdb");
            var options = new DuckDbOptions { DatabasePath = file };

            var connectionString = DuckDbConnectionFactory.BuildConnectionString(options);

            Assert.False(options.IsInMemory);
            Assert.Equal($"Data Source={Path.GetFullPath(file)}", connectionString);
            Assert.True(Directory.Exists(Path.Combine(root, "nested")));
        }
        finally
        {
            DuckDbTestHelpers.TryDeleteDirectory(root);
        }
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_InMemory_ConnectionsShareFactoryDatabase()
    {
        using var factory = DuckDbTestHelpers.CreateFactory();

        await using (var first = await factory.CreateOpenConnectionAsync())
        {
            Assert.Equal(ConnectionState.Open, first.State);
            await using var create = first.CreateCommand();
            create.CommandText = "CREATE TABLE sample AS SELECT 42 AS value";
            await create.ExecuteNonQueryAsync();
        }

        await using var second = await factory.CreateOpenConnectionAsync();
        await using var query = second.CreateCommand();
        query.CommandText = "SELECT value FROM sample";
        Assert.Equal(42, Convert.ToInt32(await query.ExecuteScalarAsync()));
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_InMemory_FactoriesAreIsolated()
    {
        using var factoryA = DuckDbTestHelpers.CreateFactory();
        using var factoryB = DuckDbTestHelpers.CreateFactory();

        await using (var connection = await factoryA.CreateOpenConnectionAsync())
        {
            await using var create = connection.CreateCommand();
            create.CommandText = "CREATE TABLE only_in_a (id INTEGER)";
            await create.ExecuteNonQueryAsync();
        }

        await using var other = await factoryB.CreateOpenConnectionAsync();
        await using var query = other.CreateCommand();
        query.CommandText = "SELECT count(*) FROM information_schema.tables WHERE table_name = 'only_in_a'";
        Assert.Equal(0L, await query.ExecuteScalarAsync());
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_FileMode_PersistsAcrossConnections()
    {
        var root = DuckDbTestHelpers.CreateTempDirectory();
        try
        {
            var file = Path.Combine(root, "persist.duckdb");
            using (var factory = DuckDbTestHelpers.CreateFactory(file))
            {
                await using var connection = await factory.CreateOpenConnectionAsync();
                await using var create = connection.CreateCommand();
                create.CommandText = "CREATE TABLE t AS SELECT 7 AS v";
                await create.ExecuteNonQueryAsync();
            }

            using var reopened = DuckDbTestHelpers.CreateFactory(file);
            await using var again = await reopened.CreateOpenConnectionAsync();
            await using var query = again.CreateCommand();
            query.CommandText = "SELECT v FROM t";
            Assert.Equal(7, Convert.ToInt32(await query.ExecuteScalarAsync()));
            Assert.True(File.Exists(file));
        }
        finally
        {
            DuckDbTestHelpers.TryDeleteDirectory(root);
        }
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_CancelledToken_Throws()
    {
        using var factory = DuckDbTestHelpers.CreateFactory();
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => factory.CreateOpenConnectionAsync(cts.Token));
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_AfterDispose_Throws()
    {
        var factory = DuckDbTestHelpers.CreateFactory();
        await factory.DisposeAsync();

        await Assert.ThrowsAsync<ObjectDisposedException>(() => factory.CreateOpenConnectionAsync());
    }
}
