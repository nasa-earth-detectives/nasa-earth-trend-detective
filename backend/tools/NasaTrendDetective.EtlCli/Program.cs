using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Extensions;
using NasaTrendDetective.Infrastructure.Interfaces;

// ETL console tool. Reuses Infrastructure components (normalizer and importer)
// so that the CSV -> Parquet -> DuckDB path is identical locally, in CI, and in the API.
//
//   normalize --source <csv> --variable <ClimateVariable name, e.g. Gistemp or Merra2Temperature>
//             [--output <x.parquet>]
//             [--output-dir <directory>] [--time-format %Y-%m-%d]
//   seed      [--directory <directory>]     (loads Parquet + manifests into the DUCKDB_DATABASE_PATH database)
//
// Relative paths are relative to the working directory: run from the repo root. By
// default it reads from and writes to backend/seed, the versioned folder that the API seeds (local and Docker).

const string SeedDirectory = "backend/seed";
var command = args.FirstOrDefault();
var options = ParseOptions(args.Skip(1).ToArray());
if (command is not ("normalize" or "seed"))
{
    Console.Error.WriteLine("Usage: normalize --source <csv> --variable <name> [--output <x.parquet>] [--time-format <fmt>]");
    Console.Error.WriteLine("       seed [--directory <directory>]");
    return 2;
}

var configuration = new ConfigurationBuilder()
    .AddJsonFile(Path.Combine(AppContext.BaseDirectory, "appsettings.json"), optional: true)
    .AddEnvironmentVariables()
    // normalize only uses DuckDB as a computation engine: in-memory, to avoid creating a database on disk.
    .AddInMemoryCollection(command == "normalize"
        ? new Dictionary<string, string?>
        {
            ["DUCKDB_DATABASE_PATH"] = ":memory:",
            ["GridNormalization:OutputDirectory"] = options.GetValueOrDefault("output-dir", SeedDirectory),
        }
        : [])
    .Build();

var services = new ServiceCollection()
    .AddLogging(logging => logging.AddSimpleConsole(o => o.SingleLine = true))
    .AddInfrastructure(configuration);
await using var provider = services.BuildServiceProvider();
var clock = Stopwatch.StartNew();

if (command == "normalize")
{
    var source = Required(options, "source");
    var variable = Enum.Parse<ClimateVariable>(Required(options, "variable"), ignoreCase: true);
    var mapping = new GridColumnMapping
    {
        LatitudeColumn = "lat",
        LongitudeColumn = "lon",
        TimeColumn = "time",
        ValueColumn = "value",
        AnomalyColumn = "anomaly",
        TimeFormat = options.GetValueOrDefault("time-format", "%Y-%m-%d"),
    };

    var normalizer = provider.GetRequiredService<ISpatialGridNormalizer>();
    var result = await normalizer.NormalizeAsync(
        new GridNormalizationRequest(source, variable, mapping, options.GetValueOrDefault("output")));
    var bytes = new FileInfo(result.OutputPath).Length;
    Console.WriteLine($"{result.SourceRows} rows read -> {result.RowsWritten} written | "
        + $"{bytes / 1_048_576.0:F1} MB | {clock.Elapsed.TotalSeconds:F1} s | {result.OutputPath}");
    Console.WriteLine($"peak memory: {Process.GetCurrentProcess().PeakWorkingSet64 / 1_048_576.0:F0} MB");
    return 0;
}

await provider.GetRequiredService<IDuckDbSchemaInitializer>().InitializeAsync();
var outcomes = await provider.GetRequiredService<IDatasetSeeder>()
    .SeedAsync(options.GetValueOrDefault("directory", SeedDirectory));
foreach (var outcome in outcomes)
{
    Console.WriteLine($"{outcome.ManifestFile}: {outcome.Status} · {outcome.Rows} facts · "
        + $"{outcome.Elapsed.TotalSeconds:F1} s · {outcome.Message}");
}

// Process peak memory: determines whether loading fits within a small plan (e.g., 512 MB).
Console.WriteLine($"peak memory: {Process.GetCurrentProcess().PeakWorkingSet64 / 1_048_576.0:F0} MB");
return outcomes.Any(o => o.Status == DatasetSeedStatus.Failed) ? 1 : 0;

static Dictionary<string, string> ParseOptions(string[] tokens)
{
    var parsed = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i + 1 < tokens.Length; i += 2)
    {
        if (!tokens[i].StartsWith("--", StringComparison.Ordinal))
        {
            throw new ArgumentException($"Expected --option but got '{tokens[i]}'.");
        }

        parsed[tokens[i][2..]] = tokens[i + 1];
    }

    return parsed;
}

static string Required(Dictionary<string, string> options, string name) =>
    options.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value)
        ? value
        : throw new ArgumentException($"Missing --{name}.");
