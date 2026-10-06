using System.Diagnostics;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Siembra DuckDB con los pares Parquet + manifiesto de una carpeta, reutilizando el importador
/// canónico. El orden (borrar procedencia, borrar hechos, importar, registrar procedencia) garantiza
/// que nunca queda una procedencia apuntando a hechos a medio cargar: si algo falla a mitad, la
/// variable queda sin procedencia, la API la declara "synthetic" y el siguiente arranque reintenta.
/// </summary>
public sealed class DatasetSeeder : IDatasetSeeder
{
    private readonly IDuckDbRepository _repository;
    private readonly IParquetImporter _importer;
    private readonly DatasetSeedOptions _options;
    private readonly ILogger<DatasetSeeder> _logger;

    public DatasetSeeder(
        IDuckDbRepository repository,
        IParquetImporter importer,
        IOptions<DatasetSeedOptions> options,
        ILogger<DatasetSeeder> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _importer = importer ?? throw new ArgumentNullException(nameof(importer));
        _options = options.Value;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<DatasetSeedOutcome>> SeedAsync(
        string? directory = null,
        CancellationToken cancellationToken = default)
    {
        var folder = Path.GetFullPath(string.IsNullOrWhiteSpace(directory) ? _options.Directory : directory);
        if (!Directory.Exists(folder))
        {
            _logger.LogInformation("Sin carpeta de datasets en {Folder}: la API servirá solo datos sintéticos.", folder);
            return [];
        }

        var outcomes = new List<DatasetSeedOutcome>();
        foreach (var manifestPath in Directory.EnumerateFiles(folder, "*" + DatasetManifest.FileSuffix).Order())
        {
            var outcome = await SeedOneAsync(manifestPath, cancellationToken).ConfigureAwait(false);
            _logger.Log(
                outcome.Status == DatasetSeedStatus.Failed ? LogLevel.Error : LogLevel.Information,
                "Dataset {File} ({Variable}): {Status} · {Rows} hechos · {Seconds:F1} s · {Message}",
                outcome.ManifestFile, outcome.Variable, outcome.Status, outcome.Rows,
                outcome.Elapsed.TotalSeconds, outcome.Message);
            outcomes.Add(outcome);
        }

        return outcomes;
    }

    private async Task<DatasetSeedOutcome> SeedOneAsync(string manifestPath, CancellationToken ct)
    {
        var clock = Stopwatch.StartNew();
        var file = Path.GetFileName(manifestPath);
        DatasetManifest? manifest = null;
        try
        {
            manifest = await DatasetManifest.LoadAsync(manifestPath, ct).ConfigureAwait(false);
            var variableId = (byte)manifest.ClimateVariable;
            var parameters = new Dictionary<string, object?> { ["varId"] = variableId };
            var parquetPath = DatasetManifest.ParquetPathFor(manifestPath);
            if (!File.Exists(parquetPath))
            {
                return new(file, manifest.ClimateVariable, DatasetSeedStatus.Skipped, 0, clock.Elapsed,
                    $"falta {Path.GetFileName(parquetPath)}");
            }

            var parquetSha = await HashAsync(parquetPath, ct).ConfigureAwait(false);
            var loadedSha = await _repository.ExecuteScalarAsync<string>(DatasetSeedSql.LoadedParquetHash, parameters, ct)
                .ConfigureAwait(false);
            if (string.Equals(loadedSha, parquetSha, StringComparison.OrdinalIgnoreCase))
            {
                var rows = await _repository.ExecuteScalarAsync<long>(DatasetSeedSql.CountFacts, parameters, ct)
                    .ConfigureAwait(false);
                return new(file, manifest.ClimateVariable, DatasetSeedStatus.Unchanged, rows, clock.Elapsed, "ya cargado");
            }

            var duckPath = parquetPath.Replace('\\', '/');
            var variables = await _repository.QueryAsync(DatasetSeedSql.DistinctVariables(duckPath), r => r.GetInt32(0), null, ct)
                .ConfigureAwait(false);
            if (variables.Count != 1 || variables[0] != variableId)
            {
                throw new InvalidDataException(
                    $"el Parquet trae variable_id [{string.Join(", ", variables)}] y el manifiesto declara {variableId}");
            }

            await _repository.ExecuteAsync(DatasetSeedSql.DeleteProvenance, parameters, ct).ConfigureAwait(false);
            await _repository.ExecuteAsync(DatasetSeedSql.DeleteFacts, parameters, ct).ConfigureAwait(false);
            await _importer.ImportAsync(duckPath, ct).ConfigureAwait(false);
            var imported = await _repository.ExecuteScalarAsync<long>(DatasetSeedSql.CountFacts, parameters, ct)
                .ConfigureAwait(false);
            await _repository.ExecuteAsync(
                    DatasetSeedSql.InsertProvenance,
                    ProvenanceParameters(manifest, variableId, Path.GetFileName(parquetPath), parquetSha, imported),
                    ct)
                .ConfigureAwait(false);
            return new(file, manifest.ClimateVariable, DatasetSeedStatus.Imported, imported, clock.Elapsed, manifest.Provider);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new(file, manifest?.ClimateVariable, DatasetSeedStatus.Failed, 0, clock.Elapsed, ex.Message);
        }
    }

    private static Dictionary<string, object?> ProvenanceParameters(
        DatasetManifest m, byte variableId, string parquetFile, string parquetSha, long rows) => new()
    {
        ["varId"] = variableId,
        ["provider"] = m.Provider,
        ["product"] = m.Product,
        ["unit"] = m.Unit,
        ["trendUnit"] = m.TrendUnit,
        ["baseline"] = m.Baseline,
        ["resolution"] = m.ResolutionDegrees,
        ["sourceUrl"] = m.SourceUrl,
        ["sourceFile"] = m.SourceFile,
        ["sourceSha"] = m.SourceSha256,
        ["retrievedAt"] = m.RetrievedAt.UtcDateTime,
        ["coverageStart"] = (short)m.CoverageStart,
        ["coverageEnd"] = (short)m.CoverageEnd,
        ["lastMonth"] = m.LastMonth,
        ["interim"] = m.Interim,
        ["citation"] = m.Citation,
        ["parquetFile"] = parquetFile,
        ["parquetSha"] = parquetSha,
        ["rowCount"] = rows,
        ["loadedAt"] = DateTime.UtcNow
    };

    private static async Task<string> HashAsync(string path, CancellationToken ct)
    {
        await using var stream = File.OpenRead(path);
        return Convert.ToHexStringLower(await SHA256.HashDataAsync(stream, ct).ConfigureAwait(false));
    }
}
