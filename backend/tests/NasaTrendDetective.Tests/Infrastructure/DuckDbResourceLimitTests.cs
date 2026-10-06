using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure;

public sealed class DuckDbResourceLimitTests
{
    [Fact]
    public void BuildSettingsSql_WithoutLimits_ReturnsNull()
    {
        Assert.Null(DuckDbConnectionFactory.BuildSettingsSql(new DuckDbOptions()));
    }

    [Fact]
    public void BuildSettingsSql_FileDatabase_CreatesTempDirectoryNextToTheFile()
    {
        var folder = DuckDbTestHelpers.CreateTempDirectory();
        try
        {
            var options = new DuckDbOptions
            {
                DatabasePath = Path.Combine(folder, "x.duckdb"),
                MemoryLimit = "256MB",
                Threads = 2,
            };

            var sql = DuckDbConnectionFactory.BuildSettingsSql(options);

            Assert.NotNull(sql);
            Assert.Contains("SET memory_limit = '256MB'", sql);
            Assert.Contains("SET threads = 2", sql);
            Assert.Contains("x.duckdb.tmp", sql);
            Assert.True(Directory.Exists(Path.Combine(folder, "x.duckdb.tmp")));
        }
        finally
        {
            DuckDbTestHelpers.TryDeleteDirectory(folder);
        }
    }

    [Theory]
    [InlineData("256")]
    [InlineData("256MB'; DROP TABLE dim_variable; --")]
    [InlineData("mucho")]
    public void BuildSettingsSql_InvalidLimit_Throws(string limit)
    {
        Assert.Throws<ArgumentException>(() =>
            DuckDbConnectionFactory.BuildSettingsSql(new DuckDbOptions { DatabasePath = ":memory:", MemoryLimit = limit }));
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_AppliesTheMemoryLimit()
    {
        using var factory = new DuckDbConnectionFactory(Microsoft.Extensions.Options.Options.Create(
            new DuckDbOptions { DatabasePath = ":memory:", MemoryLimit = "300MB" }));
        await using var connection = await factory.CreateOpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT current_setting('memory_limit')";

        var value = Convert.ToString(await command.ExecuteScalarAsync());

        // DuckDB lo reporta en su propia unidad (MiB/MB); basta con que ya no sea el 80 % de la RAM.
        Assert.Matches(@"^(286\.\d MiB|300\.0 MB)$", value);
    }
}
