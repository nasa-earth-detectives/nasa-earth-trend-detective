using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using NasaTrendDetective.Application.DTOs;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.ScientificValidation;

/// <summary>
/// Boots the API host once against an isolated temporary DuckDB populated from the tracked
/// repository seed Parquets (backend/seed) so real 2000-2025 queries run without altering developer state.
/// </summary>
public sealed class RealSeededApiFixture : IAsyncLifetime
{
    private readonly string _tempDir = Path.Combine(
        Path.GetTempPath(), $"ntd-real-seed-{Guid.NewGuid():N}");

    private WebApplicationFactory<Program>? _factory;

    public string SeedDirectory { get; } = ResolveSeedDirectory();
    public string TempDatabasePath => Path.Combine(_tempDir, "real_seed_qa.duckdb");
    public HttpClient Client { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Directory.CreateDirectory(_tempDir);
        var prevSeed = Environment.GetEnvironmentVariable(DatasetSeedOptions.EnvironmentVariable);
        var prevDb = Environment.GetEnvironmentVariable(DuckDbOptions.EnvironmentVariable);

        try
        {
            Environment.SetEnvironmentVariable(DatasetSeedOptions.EnvironmentVariable, SeedDirectory);
            Environment.SetEnvironmentVariable(DuckDbOptions.EnvironmentVariable, TempDatabasePath);

            _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["DatasetSeed:Directory"] = SeedDirectory,
                        ["DuckDb:DatabasePath"] = TempDatabasePath,
                    });
                });
            });

            Client = _factory.CreateClient();
            Client.DefaultRequestHeaders.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IntegrationTest/1.0");

            await WaitForAllDatasetsObservedAsync();
        }
        finally
        {
            Environment.SetEnvironmentVariable(DatasetSeedOptions.EnvironmentVariable, prevSeed);
            Environment.SetEnvironmentVariable(DuckDbOptions.EnvironmentVariable, prevDb);
        }
    }

    public async Task DisposeAsync()
    {
        Client.Dispose();
        if (_factory is not null)
        {
            await _factory.DisposeAsync();
        }

        try
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }
        catch (IOException)
        {
            // DuckDB native handle release may lag briefly on Windows teardown.
        }
    }

    private async Task WaitForAllDatasetsObservedAsync()
    {
        var deadline = DateTime.UtcNow.AddSeconds(120);
        while (DateTime.UtcNow < deadline)
        {
            var datasets = await Client.GetFromJsonAsync<List<DatasetStatusDto>>("/api/datasets");
            if (datasets is { Count: 9 } && datasets.All(d => d.Status == DatasetStatusDto.Observed))
            {
                return;
            }

            await Task.Delay(500);
        }

        throw new TimeoutException(
            $"Timed out waiting for all 9 datasets in '{SeedDirectory}' to seed into '{TempDatabasePath}'.");
    }

    private static string ResolveSeedDirectory()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "backend", "seed");
            if (Directory.Exists(candidate) && File.Exists(Path.Combine(candidate, "gistemp_v4.parquet")))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate 'backend/seed' from test execution directory.");
    }
}
