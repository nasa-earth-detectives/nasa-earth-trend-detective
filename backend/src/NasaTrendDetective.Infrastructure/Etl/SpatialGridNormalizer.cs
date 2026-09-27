using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Pipeline normalizador de grilla espacial: lee el archivo crudo con el <see cref="IRawDatasetReader"/>
/// adecuado, aplica la normalización WGS84 canónica y la limpieza/imputación en SQL DuckDB y exporta con
/// COPY ... TO '*.parquet' (FORMAT PARQUET, COMPRESSION SNAPPY) para el importador de hechos.
/// </summary>
public sealed class SpatialGridNormalizer : ISpatialGridNormalizer
{
    private readonly IDuckDbConnectionFactory _connectionFactory;
    private readonly IReadOnlyList<IRawDatasetReader> _readers;
    private readonly GridNormalizationOptions _options;
    private readonly ILogger<SpatialGridNormalizer> _logger;

    public SpatialGridNormalizer(
        IDuckDbConnectionFactory connectionFactory,
        IEnumerable<IRawDatasetReader> readers,
        IOptions<GridNormalizationOptions> options,
        ILogger<SpatialGridNormalizer> logger)
    {
        ArgumentNullException.ThrowIfNull(connectionFactory);
        ArgumentNullException.ThrowIfNull(readers);
        ArgumentNullException.ThrowIfNull(options);
        _connectionFactory = connectionFactory;
        _readers = readers.ToList();
        _options = options.Value;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<GridNormalizationResult> NormalizeAsync(
        GridNormalizationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.SourcePath);
        if (!File.Exists(request.SourcePath))
        {
            throw new FileNotFoundException("No existe el archivo crudo a normalizar.", request.SourcePath);
        }

        var reader = ResolveReader(request.SourcePath);
        var variableName = request.Variable.ToString();
        var mapping = request.Mapping ?? _options.ResolveMapping(variableName);
        var cleaning = _options.Cleaning.Resolve(variableName, mapping.MissingValue);
        var sourcePath = Path.GetFullPath(request.SourcePath);
        var outputPath = ResolveOutputPath(request);

        var rawSql = reader.BuildSelectSql(sourcePath, mapping);
        var canonicalSql = CanonicalGridSql.Build(rawSql, (byte)request.Variable, mapping);
        var cleanSql = DataCleaningSql.Build(canonicalSql, cleaning);
        var cleanTable = $"etl_clean_{Guid.NewGuid():N}";

        await using var connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        var sourceRows = await DuckDbEtlCommands
            .ScalarAsync(connection, $"SELECT count(*) FROM ({rawSql})", cancellationToken)
            .ConfigureAwait(false);
        await DuckDbEtlCommands.ExecuteAsync(
                connection,
                $"CREATE TEMP TABLE {DuckDbSqlText.Identifier(cleanTable)} AS {cleanSql}",
                cancellationToken)
            .ConfigureAwait(false);
        try
        {
            var quality = await DuckDbEtlCommands
                .ReadQualityAsync(connection, cleanTable, request.Variable, cancellationToken)
                .ConfigureAwait(false);
            await DuckDbEtlCommands
                .ExecuteAsync(connection, CanonicalGridSql.BuildCopy(cleanTable, outputPath), cancellationToken)
                .ConfigureAwait(false);
            var written = await DuckDbEtlCommands.ScalarAsync(
                    connection,
                    $"SELECT count(*) FROM read_parquet({DuckDbSqlText.Literal(outputPath)})",
                    cancellationToken)
                .ConfigureAwait(false);

            LogQuality(quality);
            return new GridNormalizationResult(outputPath, sourceRows, written, quality);
        }
        finally
        {
            await DuckDbEtlCommands.ExecuteAsync(
                    connection,
                    $"DROP TABLE IF EXISTS {DuckDbSqlText.Identifier(cleanTable)}",
                    CancellationToken.None)
                .ConfigureAwait(false);
        }
    }

    private void LogQuality(DataQualityMetrics quality) =>
        _logger.LogInformation(
            "Calidad {Variable}: {ValidBefore}% válidos antes de imputar, {ValidAfter}% después "
            + "({Imputed} imputados, {Nulls} NULL de {Total} observaciones)",
            quality.Variable,
            quality.ValidPercentBeforeImputation,
            quality.ValidPercentAfterImputation,
            quality.ImputedValues,
            quality.NullAfterImputation,
            quality.TotalObservations);

    private IRawDatasetReader ResolveReader(string sourcePath) =>
        _readers.FirstOrDefault(reader => reader.CanRead(sourcePath))
        ?? throw new NotSupportedException(
            $"Formato no soportado para '{Path.GetFileName(sourcePath)}'. Hoy solo hay lector CSV; "
            + "NetCDF/HDF5/GeoTIFF son un punto de extensión (registrar otro IRawDatasetReader).");

    private string ResolveOutputPath(GridNormalizationRequest request)
    {
        var fileName = request.OutputFileName
            ?? $"{request.Variable}_{Path.GetFileNameWithoutExtension(request.SourcePath)}.parquet";
        if (fileName != Path.GetFileName(fileName) || fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            throw new ArgumentException($"Nombre de archivo de salida inválido: '{fileName}'.", nameof(request));
        }

        if (!fileName.EndsWith(".parquet", StringComparison.OrdinalIgnoreCase))
        {
            fileName += ".parquet";
        }

        var directory = Path.GetFullPath(_options.OutputDirectory);
        Directory.CreateDirectory(directory);
        return Path.Combine(directory, fileName);
    }
}
