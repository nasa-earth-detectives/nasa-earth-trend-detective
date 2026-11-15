using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Implements;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Extensions;

/// <summary>
/// Registration of the ETL pipeline: spatial grid normalization and bulk Parquet import.
/// </summary>
public static class EtlServiceCollectionExtensions
{
    /// <summary>
    /// Registers <see cref="ISpatialGridNormalizer"/> and available raw readers
    /// (currently CSV). Configuration in the "GridNormalization" section.
    /// </summary>
    public static IServiceCollection AddGridNormalization(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<GridNormalizationOptions>()
            .Bind(configuration.GetSection(GridNormalizationOptions.SectionName));

        services.AddSingleton<IRawDatasetReader, CsvRawDatasetReader>();
        services.AddSingleton<ISpatialGridNormalizer, SpatialGridNormalizer>();
        return services;
    }

    /// <summary>
    /// Registers <see cref="IParquetImporter"/> (bulk import into fact_climate_observations).
    /// Configuration in the "ParquetImport" section (SourceGlob).
    /// </summary>
    public static IServiceCollection AddParquetImport(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<ParquetImportOptions>()
            .Bind(configuration.GetSection(ParquetImportOptions.SectionName));

        services.AddLogging();
        services.AddSingleton<IParquetImporter, ParquetImporter>();
        return services;
    }

    /// <summary>
    /// Registers dataset seeding (Parquet + manifest) and its startup hosted service.
    /// Configuration in the "DatasetSeed" section; DATASET_SEED_DIRECTORY takes precedence.
    /// </summary>
    public static IServiceCollection AddDatasetSeed(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<DatasetSeedOptions>()
            .Bind(configuration.GetSection(DatasetSeedOptions.SectionName))
            .PostConfigure(options =>
            {
                var overrideDirectory = configuration[DatasetSeedOptions.EnvironmentVariable]
                    ?? Environment.GetEnvironmentVariable(DatasetSeedOptions.EnvironmentVariable);
                if (!string.IsNullOrWhiteSpace(overrideDirectory))
                {
                    options.Directory = overrideDirectory;
                }
            });

        services.AddSingleton<IDatasetSeeder, DatasetSeeder>();
        services.AddSingleton<DatasetSeedState>();
        services.AddSingleton<NasaTrendDetective.Application.Interfaces.IDatasetSeedState>(
            provider => provider.GetRequiredService<DatasetSeedState>());
        services.AddHostedService<DatasetSeedHostedService>();
        return services;
    }
}
