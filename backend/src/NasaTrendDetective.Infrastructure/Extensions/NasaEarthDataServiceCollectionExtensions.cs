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
/// NASA EarthData client registration: typed HttpClient + resilience pipeline (Polly).
/// </summary>
public static class NasaEarthDataServiceCollectionExtensions
{
    public const string ResiliencePipelineName = "nasa-earthdata";

    /// <summary>
    /// Registers <see cref="INasaEarthDataClient"/>. Configuration in the "NasaEarthData" section;
    /// NASA_EARTHDATA_TOKEN (configuration or environment variable) takes precedence for authentication tokens.
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
                    // Large downloads must not be cut off by the default 100s timeout:
                    // per-attempt timeouts are enforced by the resilience pipeline and cancellation via CancellationToken.
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

        // Retries on 408, 429, 5xx, HttpRequestException, and per-attempt timeouts.
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
