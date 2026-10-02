using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.ExternalServices;
using NasaTrendDetective.Infrastructure.Extensions;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

internal static class NasaEarthDataTestHelpers
{
    public const string TestToken = "test-earthdata-token";
    public const string CmrBaseUrl = "https://cmr.test.local/";
    public const string TrustedTestHost = "test.local";

    public static string CreateTempCacheDirectory() =>
        Path.Combine(Path.GetTempPath(), "nasa-earthdata-tests", Guid.NewGuid().ToString("N"));

    /// <summary>
    /// Cliente construido a mano (sin pipeline de resiliencia) para aislar el token del entorno.
    /// </summary>
    public static NasaEarthDataClient CreateClient(FakeHttpMessageHandler handler, string cacheDirectory, string? token)
    {
        var options = Options.Create(new NasaEarthDataOptions
        {
            Token = token,
            CmrBaseUrl = CmrBaseUrl,
            CacheDirectory = cacheDirectory,
            AdditionalTrustedTokenHosts = [TrustedTestHost]
        });
        return new NasaEarthDataClient(new HttpClient(handler), options, NullLogger<NasaEarthDataClient>.Instance);
    }

    /// <summary>
    /// Proveedor DI real (HttpClient tipado + resiliencia) con el handler simulado como primario.
    /// </summary>
    public static ServiceProvider BuildProvider(
        FakeHttpMessageHandler handler,
        string cacheDirectory,
        string attemptTimeout = "00:00:05")
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [NasaEarthDataOptions.TokenEnvironmentVariable] = TestToken,
            ["NasaEarthData:CmrBaseUrl"] = CmrBaseUrl,
            ["NasaEarthData:CacheDirectory"] = cacheDirectory,
            ["NasaEarthData:AdditionalTrustedTokenHosts:0"] = TrustedTestHost,
            ["NasaEarthData:MaxRetryAttempts"] = "3",
            ["NasaEarthData:RetryBaseDelay"] = "00:00:00.001",
            ["NasaEarthData:AttemptTimeout"] = attemptTimeout
        }).Build();

        var services = new ServiceCollection().AddNasaEarthData(configuration);
        services.AddHttpClient(NasaEarthDataClient.HttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => handler);
        return services.BuildServiceProvider();
    }

    public static void TryDeleteDirectory(string path)
    {
        try
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, recursive: true);
            }
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
