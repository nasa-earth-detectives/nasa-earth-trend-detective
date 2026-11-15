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

        // DuckDB reports this in its own units (MiB/MB); it is sufficient that it is no longer 80% of RAM.
        Assert.Matches(@"^(286\.\d MiB|300\.0 MB)$", value);
    }

    [Fact]
    public void BuildSettingsSql_AllocatorOptions_AreValidatedAndEmitted()
    {
        var sql = DuckDbConnectionFactory.BuildSettingsSql(new DuckDbOptions
        {
            DatabasePath = ":memory:",
            AllocatorFlushThreshold = "16MB",
            AllocatorBackgroundThreads = true
        });

        Assert.Contains("SET allocator_flush_threshold = '16MB'", sql);
        Assert.Contains("SET allocator_background_threads = true", sql);
        Assert.Throws<ArgumentException>(() => DuckDbConnectionFactory.BuildSettingsSql(
            new DuckDbOptions { DatabasePath = ":memory:", AllocatorFlushThreshold = "16MB'; DROP TABLE dim_variable; --" }));
    }

    /// <summary>
    /// The engine must accept the allocator settings as written: a misspelt one would stop the API at startup.
    /// </summary>
    [Fact]
    public async Task CreateOpenConnectionAsync_AppliesTheAllocatorSettings()
    {
        using var factory = new DuckDbConnectionFactory(Microsoft.Extensions.Options.Options.Create(
            new DuckDbOptions { DatabasePath = ":memory:", AllocatorFlushThreshold = "16MB", AllocatorBackgroundThreads = false }));
        await using var connection = await factory.CreateOpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT current_setting('allocator_flush_threshold')";

        var value = Convert.ToString(await command.ExecuteScalarAsync());

        Assert.Matches(@"^(15\.2 MiB|16\.0 MiB|16\.0 MB)$", value);
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_FileMode_PreservesLimitsAcrossDisposedConnections()
    {
        var folder = DuckDbTestHelpers.CreateTempDirectory();
        try
        {
            using var factory = new DuckDbConnectionFactory(Microsoft.Extensions.Options.Options.Create(
                new DuckDbOptions
                {
                    DatabasePath = System.IO.Path.Combine(folder, "limits.duckdb"),
                    MemoryLimit = "140MB",
                    Threads = 1
                }));

            await using (await factory.CreateOpenConnectionAsync())
            {
            }

            await using var second = await factory.CreateOpenConnectionAsync();
            await using var command = second.CreateCommand();
            command.CommandText =
                "SELECT current_setting('memory_limit'), current_setting('threads'), current_setting('preserve_insertion_order')";
            await using var reader = await command.ExecuteReaderAsync();
            Assert.True(await reader.ReadAsync());

            var memoryLimit = Convert.ToString(reader.GetValue(0));
            var threads = Convert.ToInt64(reader.GetValue(1));
            var preserveOrder = Convert.ToBoolean(reader.GetValue(2));

            Assert.Matches(@"^(133\.\d MiB|140\.0 MB)$", memoryLimit);
            Assert.Equal(1L, threads);
            Assert.False(preserveOrder);
        }
        finally
        {
            DuckDbTestHelpers.TryDeleteDirectory(folder);
        }
    }
}
