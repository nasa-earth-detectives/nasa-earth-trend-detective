using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly.Timeout;
using NasaTrendDetective.Infrastructure.ExternalServices.Models;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Cliente HTTP tipado de NASA EarthData. Los reintentos (429/5xx/timeouts) los aplica el
/// pipeline de resiliencia registrado en DI; aquí solo se arma cada request y se gestiona la caché.
/// </summary>
public sealed class NasaEarthDataClient : INasaEarthDataClient
{
    public const string HttpClientName = "NasaEarthData";

    private readonly HttpClient _httpClient;
    private readonly NasaEarthDataOptions _options;
    private readonly NasaFileCache _cache;
    private readonly ILogger<NasaEarthDataClient> _logger;

    public NasaEarthDataClient(
        HttpClient httpClient,
        IOptions<NasaEarthDataOptions> options,
        ILogger<NasaEarthDataClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cache = new NasaFileCache(_options.CacheDirectory);
    }

    public async Task<IReadOnlyList<CmrGranule>> SearchGranulesAsync(
        GranuleSearchRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = CmrQueryBuilder.Build(_options.CmrBaseUrl, request);
        using var message = CreateRequest(url, requiresAuthentication: false);
        using var response = await SendAsync(message, cancellationToken).ConfigureAwait(false);

        await using var body = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        using var document = await JsonDocument.ParseAsync(body, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        var granules = CmrGranuleParser.Parse(document);
        _logger.LogInformation("CMR devolvió {Count} granules para {ShortName}", granules.Count, request.ShortName);
        return granules;
    }

    public async Task<NasaDownloadResult> DownloadFileAsync(
        Uri url,
        bool requiresAuthentication,
        string? fileName = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(url);
        var path = _cache.ResolvePath(url, fileName);
        if (_cache.TryGetCached(path, out var cachedSize))
        {
            _logger.LogDebug("Caché NASA: {Path} ya existe, se omite la descarga", path);
            return new NasaDownloadResult(path, cachedSize, FromCache: true);
        }

        using var message = CreateRequest(url, requiresAuthentication);
        using var response = await SendAsync(message, cancellationToken).ConfigureAwait(false);
        await using var body = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        var size = await _cache.WriteAtomicAsync(path, body, response.Content.Headers.ContentLength, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation("Descargado {Host}{Path} ({Size} bytes) en caché", url.Host, url.AbsolutePath, size);
        return new NasaDownloadResult(path, size, FromCache: false);
    }

    public Task<NasaDownloadResult> DownloadDatasetAsync(
        NasaDataset dataset,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dataset);
        if (dataset.DirectUrl is null)
        {
            throw new InvalidOperationException(
                $"El dataset '{dataset.Key}' no tiene URL directa; busca sus granules con SearchGranulesAsync.");
        }

        return DownloadFileAsync(dataset.DirectUrl, dataset.RequiresAuthentication, null, cancellationToken);
    }

    private HttpRequestMessage CreateRequest(Uri url, bool requiresAuthentication)
    {
        var message = new HttpRequestMessage(HttpMethod.Get, url);
        if (!requiresAuthentication)
        {
            return message;
        }

        if (!_options.HasToken)
        {
            message.Dispose();
            throw new NasaEarthDataAuthenticationException();
        }

        if (!NasaTokenHostPolicy.IsTrusted(url, _options.AdditionalTrustedTokenHosts))
        {
            message.Dispose();
            throw new NasaEarthDataException(
                $"El host {url.Host} no es un dominio Earthdata de confianza (HTTPS); no se envía el token.");
        }

        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Token!.Trim());
        return message;
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage message, CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await _httpClient
                .SendAsync(message, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            throw new NasaEarthDataException($"Error de red al consultar {message.RequestUri?.Host}.", ex);
        }
        catch (TimeoutRejectedException ex)
        {
            throw new NasaEarthDataException($"Tiempo de espera agotado con {message.RequestUri?.Host}.", ex);
        }

        if (response.IsSuccessStatusCode)
        {
            return response;
        }

        var status = (int)response.StatusCode;
        response.Dispose();
        throw status is 401 or 403
            ? new NasaEarthDataException($"NASA EarthData rechazó la autenticación ({status}). Revisa el token.")
            : new NasaEarthDataException($"NASA EarthData respondió {status} para {message.RequestUri?.Host}.");
    }
}
