using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NasaTrendDetective.Infrastructure.Implements;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Extensions;

/// <summary>
/// Infrastructure layer dependency injection registrations.
/// </summary>
public static class InfrastructureServiceCollectionExtensions
{
    /// <remarks>
    /// Registration order matters: AddDuckDb registers the service that creates the schema,
    /// and AddDatasetSeed populates it; the host starts them in that sequence.
    /// </remarks>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        return services
            .AddDuckDb(configuration)
            .AddNasaEarthData(configuration)
            .AddGridNormalization(configuration)
            .AddParquetImport(configuration)
            .AddDatasetSeed(configuration);
    }

    /// <summary>
    /// Registers embedded DuckDB. The database path is loaded from "DuckDb:DatabasePath",
    /// with the DUCKDB_DATABASE_PATH environment variable taking precedence when set.
    /// </summary>
    public static IServiceCollection AddDuckDb(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<DuckDbOptions>()
            .Bind(configuration.GetSection(DuckDbOptions.SectionName))
            .PostConfigure(options =>
            {
                var overridePath = configuration[DuckDbOptions.EnvironmentVariable]
                    ?? Environment.GetEnvironmentVariable(DuckDbOptions.EnvironmentVariable);
                if (!string.IsNullOrWhiteSpace(overridePath))
                {
                    options.DatabasePath = overridePath;
                }
            });

        services.AddSingleton<IDuckDbConnectionFactory, DuckDbConnectionFactory>();
        services.AddSingleton<IDuckDbRepository, DuckDbRepository>();
        services.AddSingleton<IDuckDbSchemaInitializer, DuckDbSchemaInitializer>();
        services.AddHostedService<DuckDbSchemaHostedService>();
        services.AddScoped<NasaTrendDetective.Application.Interfaces.ITrendObservationRepository, TrendObservationRepository>();
        services.AddScoped<NasaTrendDetective.Application.Interfaces.IGridTrendRepository, GridTrendRepository>();
        services.AddScoped<NasaTrendDetective.Application.Interfaces.IDatasetCatalogRepository, DatasetCatalogRepository>();
        return services;
    }
}
