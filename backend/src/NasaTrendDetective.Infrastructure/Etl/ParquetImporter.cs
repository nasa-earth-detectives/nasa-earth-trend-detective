using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Resolves the file glob (relative to the working directory) and delegates bulk loading to
/// <see cref="IDuckDbRepository.ExecuteParquetIngestAsync"/>, executed entirely inside DuckDB.
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
            "Parquet import '{Glob}': {Files} file(s), {SourceRows} rows read, {Imported} new facts.",
            result.SourceGlob,
            result.FilesMatched,
            result.SourceRows,
            result.RowsImported);
        return result;
    }

    /// <summary>
    /// Converts the glob to an absolute path with '/' separators (accepted by DuckDB across all platforms).
    /// </summary>
    public static string ResolveGlob(string glob)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(glob);
        return Path.GetFullPath(glob.Trim()).Replace('\\', '/');
    }
}
