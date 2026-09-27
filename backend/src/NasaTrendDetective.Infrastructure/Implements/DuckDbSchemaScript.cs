namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Acceso al script SQL del esquema estrella embebido en el ensamblado (Scripts/init_schema.sql).
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
            ?? throw new InvalidOperationException($"No se encontró el recurso embebido '{ResourceName}'.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
