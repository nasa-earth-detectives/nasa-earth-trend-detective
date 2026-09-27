using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure;

internal static class DuckDbTestHelpers
{
    public static DuckDbConnectionFactory CreateFactory(string databasePath = DuckDbOptions.InMemoryPath) =>
        new(Options.Create(new DuckDbOptions { DatabasePath = databasePath }));

    public static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "nasa-duckdb-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }

    public static void TryDeleteDirectory(string path)
    {
        try
        {
            Directory.Delete(path, recursive: true);
        }
        catch (IOException)
        {
            // El archivo puede seguir retenido brevemente por el runtime nativo; no es crítico.
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
