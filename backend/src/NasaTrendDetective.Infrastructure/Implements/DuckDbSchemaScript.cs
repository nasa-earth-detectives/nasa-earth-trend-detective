namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Access to the star schema SQL script embedded in the assembly (Scripts/init_schema.sql).
/// </summary>
public static class DuckDbSchemaScript
{
    public const string ResourceName = "NasaTrendDetective.Infrastructure.Scripts.init_schema.sql";

    private static readonly Lazy<string> Content = new(Load);

    public static string InitSchemaSql => Content.Value;

    private static string Load()
    {
        var assembly = typeof(DuckDbSchemaScript).Assembly;
        using var stream = assembly.GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{ResourceName}' was not found.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
