using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Etl.Models;
using NasaTrendDetective.Infrastructure.Extensions;
using NasaTrendDetective.Infrastructure.Interfaces;

// Herramienta de consola del ETL. Reutiliza las piezas de Infrastructure (normalizador e importador)
// para que el camino CSV -> Parquet -> DuckDB sea el mismo en local, en CI y en la API.
//
//   normalize --source <csv> --variable <Gistemp|ModisNdvi|GraceMass|Oco2> [--output <x.parquet>]
//             [--output-dir <carpeta>] [--time-format %Y-%m-%d]
//   seed      [--directory <carpeta>]     (carga Parquet + manifiestos en la base de DUCKDB_DATABASE_PATH)
//
// Las rutas relativas son relativas al directorio de trabajo: ejecutarla desde la raíz del repo. Por
// defecto lee y escribe en backend/seed, la carpeta versionada que la API siembra (local y Docker).

const string SeedDirectory = "backend/seed";
var command = args.FirstOrDefault();
var options = ParseOptions(args.Skip(1).ToArray());
if (command is not ("normalize" or "seed"))
{
    Console.Error.WriteLine("Uso: normalize --source <csv> --variable <nombre> [--output <x.parquet>] [--time-format <fmt>]");
    Console.Error.WriteLine("     seed [--directory <carpeta>]");
    return 2;
}

var configuration = new ConfigurationBuilder()
    .AddJsonFile(Path.Combine(AppContext.BaseDirectory, "appsettings.json"), optional: true)
    .AddEnvironmentVariables()
    // normalize solo usa DuckDB como motor de cálculo: en memoria, para no crear una base en disco.
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
    Console.WriteLine($"{result.SourceRows} filas leídas -> {result.RowsWritten} escritas | "
        + $"{bytes / 1_048_576.0:F1} MB | {clock.Elapsed.TotalSeconds:F1} s | {result.OutputPath}");
    Console.WriteLine($"pico de memoria: {Process.GetCurrentProcess().PeakWorkingSet64 / 1_048_576.0:F0} MB");
    return 0;
}

await provider.GetRequiredService<IDuckDbSchemaInitializer>().InitializeAsync();
var outcomes = await provider.GetRequiredService<IDatasetSeeder>()
    .SeedAsync(options.GetValueOrDefault("directory", SeedDirectory));
foreach (var outcome in outcomes)
{
    Console.WriteLine($"{outcome.ManifestFile}: {outcome.Status} · {outcome.Rows} hechos · "
        + $"{outcome.Elapsed.TotalSeconds:F1} s · {outcome.Message}");
}

// Pico de memoria del proceso: decide si la carga cabe en un plan pequeño (p.ej. 512 MB).
Console.WriteLine($"pico de memoria: {Process.GetCurrentProcess().PeakWorkingSet64 / 1_048_576.0:F0} MB");
return outcomes.Any(o => o.Status == DatasetSeedStatus.Failed) ? 1 : 0;

static Dictionary<string, string> ParseOptions(string[] tokens)
{
    var parsed = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i + 1 < tokens.Length; i += 2)
    {
        if (!tokens[i].StartsWith("--", StringComparison.Ordinal))
        {
            throw new ArgumentException($"Se esperaba --opción y llegó '{tokens[i]}'.");
        }

        parsed[tokens[i][2..]] = tokens[i + 1];
    }

    return parsed;
}

static string Required(Dictionary<string, string> options, string name) =>
    options.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value)
        ? value
        : throw new ArgumentException($"Falta --{name}.");
