using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Extensions;
using NasaTrendDetective.Infrastructure.Implements;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Tests.Infrastructure;

public class InfrastructureServiceCollectionExtensionsTests
{
    private static ServiceProvider BuildProvider(Dictionary<string, string?> settings)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        return new ServiceCollection().AddInfrastructure(configuration).BuildServiceProvider();
    }

    [Fact]
    public void AddInfrastructure_BindsDuckDbSection()
    {
        using var provider = BuildProvider(new() { ["DuckDb:DatabasePath"] = "custom.duckdb" });

        var options = provider.GetRequiredService<IOptions<DuckDbOptions>>().Value;

        Assert.Equal("custom.duckdb", options.DatabasePath);
    }

    [Fact]
    public void AddInfrastructure_EnvironmentVariableKeyOverridesSection()
    {
        using var provider = BuildProvider(new()
        {
            ["DuckDb:DatabasePath"] = "custom.duckdb",
            [DuckDbOptions.EnvironmentVariable] = DuckDbOptions.InMemoryPath
        });

        var options = provider.GetRequiredService<IOptions<DuckDbOptions>>().Value;

        Assert.Equal(DuckDbOptions.InMemoryPath, options.DatabasePath);
    }

    [Fact]
    public async Task AddInfrastructure_ResolvesWorkingRepositoryAsSingleton()
    {
        await using var provider = BuildProvider(new()
        {
            [DuckDbOptions.EnvironmentVariable] = DuckDbOptions.InMemoryPath
        });

        var repository = provider.GetRequiredService<IDuckDbRepository>();
        var factory = provider.GetRequiredService<IDuckDbConnectionFactory>();

        Assert.Same(repository, provider.GetRequiredService<IDuckDbRepository>());
        Assert.True(factory.IsInMemory);
        Assert.True(await repository.IsHealthyAsync());
    }

    [Fact]
    public void AddInfrastructure_RegistersSchemaInitializerHostedService()
    {
        using var provider = BuildProvider(new()
        {
            [DuckDbOptions.EnvironmentVariable] = DuckDbOptions.InMemoryPath
        });

        Assert.IsType<DuckDbSchemaInitializer>(provider.GetRequiredService<IDuckDbSchemaInitializer>());
        Assert.Contains(
            provider.GetServices<Microsoft.Extensions.Hosting.IHostedService>(),
            service => service is DuckDbSchemaHostedService);
    }

    [Fact]
    public void AddInfrastructure_RegistersParquetImporterAndBindsGlob()
    {
        using var provider = BuildProvider(new()
        {
            [DuckDbOptions.EnvironmentVariable] = DuckDbOptions.InMemoryPath,
            ["ParquetImport:SourceGlob"] = "custom/**/*.parquet"
        });

        var options = provider.GetRequiredService<IOptions<ParquetImportOptions>>().Value;

        Assert.IsType<ParquetImporter>(provider.GetRequiredService<IParquetImporter>());
        Assert.Equal("custom/**/*.parquet", options.SourceGlob);
        Assert.Equal("data/nasa/normalized/*.parquet", new ParquetImportOptions().SourceGlob);
    }
}
