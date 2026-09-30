using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NasaTrendDetective.Infrastructure.Etl;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Extensions;

/// <summary>
/// Registro del pipeline ETL: normalización de grilla espacial e importación masiva de Parquet.
/// </summary>
public static class EtlServiceCollectionExtensions
{
    /// <summary>
    /// Registra <see cref="ISpatialGridNormalizer"/> y los lectores crudos disponibles
    /// (hoy solo CSV). Configuración en la sección "GridNormalization".
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
    /// Registra <see cref="IParquetImporter"/> (carga masiva a fact_climate_observations).
    /// Configuración en la sección "ParquetImport" (SourceGlob).
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
}
