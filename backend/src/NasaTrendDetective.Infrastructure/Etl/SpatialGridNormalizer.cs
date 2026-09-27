using DuckDB.NET.Data;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Pipeline normalizador de grilla espacial: lee el archivo crudo con el <see cref="IRawDatasetReader"/>
/// adecuado, aplica la normalización WGS84 canónica en SQL DuckDB y exporta con
/// COPY ... TO '*.parquet' (FORMAT PARQUET, COMPRESSION SNAPPY) para el importador de hechos.
/// </summary>
public sealed class SpatialGridNormalizer : ISpatialGridNormalizer
{
    private readonly IDuckDbConnectionFactory _connectionFactory;
    private readonly IReadOnlyList<IRawDatasetReader> _readers;
    private readonly GridNormalizationOptions _options;

    public SpatialGridNormalizer(
        IDuckDbConnectionFactory connectionFactory,
        IEnumerable<IRawDatasetReader> readers,
        IOptions<GridNormalizationOptions> options)
    {
        ArgumentNullException.ThrowIfNull(connectionFactory);
        ArgumentNullException.ThrowIfNull(readers);
        ArgumentNullException.ThrowIfNull(options);
        _connectionFactory = connectionFactory;
        _readers = readers.ToList();
        _options = options.Value;
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
        var mapping = request.Mapping ?? _options.ResolveMapping(request.Variable.ToString());
        var sourcePath = Path.GetFullPath(request.SourcePath);
        var outputPath = ResolveOutputPath(request);

        var rawSql = reader.BuildSelectSql(sourcePath, mapping);
        var canonicalSql = CanonicalGridSql.Build(rawSql, (byte)request.Variable, mapping);

        await using var connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        var sourceRows = await ScalarAsync(connection, $"SELECT count(*) FROM ({rawSql})", cancellationToken)
            .ConfigureAwait(false);
        await ExecuteAsync(connection, CanonicalGridSql.BuildCopy(canonicalSql, outputPath), cancellationToken)
            .ConfigureAwait(false);
        var written = await ScalarAsync(
                connection,
                $"SELECT count(*) FROM read_parquet({DuckDbSqlText.Literal(outputPath)})",
                cancellationToken)
            .ConfigureAwait(false);

        return new GridNormalizationResult(outputPath, sourceRows, written);
    }

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

    private static async Task<long> ScalarAsync(DuckDBConnection connection, string sql, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        var value = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return Convert.ToInt64(value, System.Globalization.CultureInfo.InvariantCulture);
    }

    private static async Task ExecuteAsync(DuckDBConnection connection, string sql, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}
