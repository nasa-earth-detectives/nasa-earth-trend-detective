using System.Net;
using Microsoft.Extensions.DependencyInjection;
using NasaTrendDetective.Infrastructure.ExternalServices;
using NasaTrendDetective.Infrastructure.Interfaces;
using static NasaTrendDetective.Tests.Infrastructure.NasaEarthData.NasaEarthDataTestHelpers;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

/// <summary>
/// Verifica el cliente resuelto por DI con su pipeline de resiliencia real (Polly).
/// </summary>
public sealed class NasaEarthDataResilienceTests : IDisposable
{
    private static readonly Uri FileUrl = new("https://data.test.local/OCO2/oco2_LtCO2_240101.nc4");

    private readonly string _cacheDirectory = CreateTempCacheDirectory();
    private readonly FakeHttpMessageHandler _handler = new();

    public void Dispose() => TryDeleteDirectory(_cacheDirectory);

    [Fact]
    public async Task DownloadFileAsync_RetriesAfter503AndSucceeds()
    {
        _handler.Enqueue(HttpStatusCode.ServiceUnavailable).Enqueue(HttpStatusCode.OK, "netcdf");
        await using var provider = BuildProvider(_handler, _cacheDirectory);
        var client = provider.GetRequiredService<INasaEarthDataClient>();

        var result = await client.DownloadFileAsync(FileUrl, requiresAuthentication: true);

        Assert.Equal(2, _handler.CallCount);
        Assert.All(_handler.Requests, r => Assert.Equal(TestToken, r.Authorization?.Parameter));
        Assert.Equal("netcdf", await File.ReadAllTextAsync(result.FilePath));
    }

    [Fact]
    public async Task DownloadFileAsync_RetriesAfter429()
    {
        _handler.Enqueue(HttpStatusCode.TooManyRequests).Enqueue(HttpStatusCode.OK, "ok");
        await using var provider = BuildProvider(_handler, _cacheDirectory);
        var client = provider.GetRequiredService<INasaEarthDataClient>();

        await client.DownloadFileAsync(FileUrl, requiresAuthentication: true);

        Assert.Equal(2, _handler.CallCount);
    }

    [Fact]
    public async Task DownloadFileAsync_RetriesAfterAttemptTimeout()
    {
        _handler.EnqueueHang().Enqueue(HttpStatusCode.OK, "ok");
        await using var provider = BuildProvider(_handler, _cacheDirectory, attemptTimeout: "00:00:00.200");
        var client = provider.GetRequiredService<INasaEarthDataClient>();

        var result = await client.DownloadFileAsync(FileUrl, requiresAuthentication: true);

        Assert.Equal(2, _handler.CallCount);
        Assert.False(result.FromCache);
    }

    [Fact]
    public async Task DownloadFileAsync_ExhaustedRetries_ThrowsNasaEarthDataException()
    {
        for (var i = 0; i < 4; i++)
        {
            _handler.Enqueue(HttpStatusCode.InternalServerError);
        }

        await using var provider = BuildProvider(_handler, _cacheDirectory);
        var client = provider.GetRequiredService<INasaEarthDataClient>();

        var error = await Assert.ThrowsAsync<NasaEarthDataException>(
            () => client.DownloadFileAsync(FileUrl, requiresAuthentication: true));

        Assert.Equal(4, _handler.CallCount);
        Assert.Contains("500", error.Message);
        Assert.DoesNotContain(TestToken, error.Message);
    }

    [Fact]
    public async Task DownloadFileAsync_DoesNotRetryClientErrors()
    {
        _handler.Enqueue(HttpStatusCode.Unauthorized);
        await using var provider = BuildProvider(_handler, _cacheDirectory);
        var client = provider.GetRequiredService<INasaEarthDataClient>();

        await Assert.ThrowsAsync<NasaEarthDataException>(
            () => client.DownloadFileAsync(FileUrl, requiresAuthentication: true));

        Assert.Equal(1, _handler.CallCount);
    }
}
