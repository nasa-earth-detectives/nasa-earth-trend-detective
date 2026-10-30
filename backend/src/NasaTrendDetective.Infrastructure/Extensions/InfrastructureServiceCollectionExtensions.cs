using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NasaTrendDetective.Infrastructure.Implements;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Extensions;

/// <summary>
/// Registro de dependencias de la capa de infraestructura.
/// </summary>
public static class InfrastructureServiceCollectionExtensions
{
    /// <remarks>
    /// El orden importa: AddDuckDb registra el servicio que crea el esquema y AddDatasetSeed el que
    /// lo llena; el host los arranca en ese orden.
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
    /// Registra DuckDB embebido. La ruta sale de "DuckDb:DatabasePath" y la variable de entorno
    /// DUCKDB_DATABASE_PATH tiene prioridad cuando está definida.
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
