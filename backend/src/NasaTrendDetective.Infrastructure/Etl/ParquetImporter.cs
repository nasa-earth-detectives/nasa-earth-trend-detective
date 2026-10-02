using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Resuelve el glob (relativo al directorio de trabajo) y delega la carga masiva en
/// <see cref="IDuckDbRepository.ExecuteParquetIngestAsync"/>, que se ejecuta íntegramente en DuckDB.
/// </summary>
public sealed class ParquetImporter : IParquetImporter
{
    private readonly IDuckDbRepository _repository;
    private readonly ParquetImportOptions _options;
    private readonly ILogger<ParquetImporter> _logger;

    public ParquetImporter(
        IDuckDbRepository repository,
        IOptions<ParquetImportOptions> options,
        ILogger<ParquetImporter> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _options = options.Value;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ParquetImportResult> ImportAsync(
        string? sourceGlob = null,
        CancellationToken cancellationToken = default)
    {
        var glob = ResolveGlob(string.IsNullOrWhiteSpace(sourceGlob) ? _options.SourceGlob : sourceGlob);
        var result = await _repository.ExecuteParquetIngestAsync(glob, cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Importación Parquet '{Glob}': {Files} archivo(s), {SourceRows} filas leídas, {Imported} hechos nuevos.",
            result.SourceGlob,
            result.FilesMatched,
            result.SourceRows,
            result.RowsImported);
        return result;
    }

    /// <summary>
    /// Convierte el glob en absoluto con separadores '/' (DuckDB los acepta en todas las plataformas).
    /// </summary>
    public static string ResolveGlob(string glob)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(glob);
        return Path.GetFullPath(glob.Trim()).Replace('\\', '/');
    }
}
