using System.Text.Json;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Provenance manifest accompanying each normalized Parquet file (&lt;name&gt;.provenance.json
/// alongside &lt;name&gt;.parquet). This is the only point that changes when switching sources:
/// the converter writes a new manifest in the same schema and the API exposes it directly.
/// </summary>
public sealed record DatasetManifest
{
    public const string FileSuffix = ".provenance.json";

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public string Variable { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public string Product { get; init; } = string.Empty;
    public string? Baseline { get; init; }
    public string Unit { get; init; } = string.Empty;
    public string TrendUnit { get; init; } = string.Empty;
    public bool Interim { get; init; }
    public double ResolutionDegrees { get; init; }
    public string SourceUrl { get; init; } = string.Empty;
    public string SourceFile { get; init; } = string.Empty;
    public string SourceSha256 { get; init; } = string.Empty;
    public DateTimeOffset RetrievedAt { get; init; }
    public int CoverageStart { get; init; }
    public int CoverageEnd { get; init; }
    public string LastMonth { get; init; } = string.Empty;
    public string Citation { get; init; } = string.Empty;

    /// <summary>Domain variable; validated in <see cref="Validate"/>.</summary>
    public ClimateVariable ClimateVariable => Enum.Parse<ClimateVariable>(Variable, ignoreCase: true);

    /// <summary>Sibling Parquet path: same base filename without the manifest suffix.</summary>
    public static string ParquetPathFor(string manifestPath) =>
        manifestPath[..^FileSuffix.Length] + ".parquet";

    public static async Task<DatasetManifest> LoadAsync(string path, CancellationToken cancellationToken = default)
    {
        await using var stream = File.OpenRead(path);
        var manifest = await JsonSerializer.DeserializeAsync<DatasetManifest>(stream, JsonOptions, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new InvalidDataException($"Empty manifest: {Path.GetFileName(path)}");
        manifest.Validate(Path.GetFileName(path));
        return manifest;
    }

    private void Validate(string fileName)
    {
        var errors = new List<string>();
        if (!Enum.TryParse<ClimateVariable>(Variable, ignoreCase: true, out var variable)
            || !Enum.IsDefined(variable) || int.TryParse(Variable, out _))
        {
            errors.Add($"variable '{Variable}' is not one of {string.Join(", ", Enum.GetNames<ClimateVariable>())}");
        }

        foreach (var (name, value) in new[]
                 {
                     ("provider", Provider), ("product", Product), ("unit", Unit), ("trendUnit", TrendUnit),
                     ("sourceUrl", SourceUrl), ("sourceFile", SourceFile), ("sourceSha256", SourceSha256),
                     ("lastMonth", LastMonth), ("citation", Citation)
                 })
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                errors.Add($"missing '{name}'");
            }
        }

        if (!(ResolutionDegrees > 0 && ResolutionDegrees <= 10))
        {
            errors.Add("resolutionDegrees must be in (0, 10]");
        }

        if (CoverageStart > CoverageEnd || CoverageStart < 1800 || CoverageEnd > 2200)
        {
            errors.Add($"invalid coverage {CoverageStart}-{CoverageEnd}");
        }

        if (errors.Count > 0)
        {
            throw new InvalidDataException($"Invalid manifest '{fileName}': {string.Join("; ", errors)}.");
        }
    }
}
