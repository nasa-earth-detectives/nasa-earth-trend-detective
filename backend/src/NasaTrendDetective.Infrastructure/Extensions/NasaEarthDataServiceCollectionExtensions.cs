using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.ExternalServices;
using NasaTrendDetective.Infrastructure.Interfaces;
using Polly;

namespace NasaTrendDetective.Infrastructure.Extensions;

/// <summary>
/// Registro del cliente NASA EarthData: HttpClient tipado + pipeline de resiliencia (Polly).
/// </summary>
public static class NasaEarthDataServiceCollectionExtensions
{
    public const string ResiliencePipelineName = "nasa-earthdata";

    /// <summary>
    /// Registra <see cref="INasaEarthDataClient"/>. Configuración en la sección "NasaEarthData";
    /// NASA_EARTHDATA_TOKEN (configuración o variable de entorno) tiene prioridad para el token.
    /// </summary>
    public static IServiceCollection AddNasaEarthData(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<NasaEarthDataOptions>()
            .Bind(configuration.GetSection(NasaEarthDataOptions.SectionName))
            .PostConfigure(options =>
            {
                var token = configuration[NasaEarthDataOptions.TokenEnvironmentVariable]
                    ?? Environment.GetEnvironmentVariable(NasaEarthDataOptions.TokenEnvironmentVariable);
                if (!string.IsNullOrWhiteSpace(token))
                {
                    options.Token = token;
                }
            });

        services.AddHttpClient<INasaEarthDataClient, NasaEarthDataClient>(
                NasaEarthDataClient.HttpClientName,
                client =>
                {
                    // Las descargas grandes no deben cortarse a los 100 s por defecto: el límite
                    // por intento lo aplica el pipeline de resiliencia y el resto el CancellationToken.
                    client.Timeout = Timeout.InfiniteTimeSpan;
                    client.DefaultRequestHeaders.UserAgent.Add(
                        new ProductInfoHeaderValue("NasaTrendDetective", "1.0"));
                })
            .RedactLoggedHeaders(_ => true)
            .AddResilienceHandler(ResiliencePipelineName, ConfigureResilience);

        return services;
    }

    private static void ConfigureResilience(
        ResiliencePipelineBuilder<HttpResponseMessage> builder,
        ResilienceHandlerContext context)
    {
        var options = context.ServiceProvider.GetRequiredService<IOptions<NasaEarthDataOptions>>().Value;

        // Reintenta ante 408, 429, 5xx, HttpRequestException y timeouts por intento.
        builder.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = Math.Max(options.MaxRetryAttempts, 0),
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true,
            Delay = options.RetryBaseDelay,
            ShouldRetryAfterHeader = true
        });

        builder.AddTimeout(new HttpTimeoutStrategyOptions { Timeout = options.AttemptTimeout });
    }
}
