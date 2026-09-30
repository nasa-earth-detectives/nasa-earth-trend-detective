using System.Net;
using NasaTrendDetective.Infrastructure.ExternalServices;
using NasaTrendDetective.Infrastructure.ExternalServices.Models;
using static NasaTrendDetective.Tests.Infrastructure.NasaEarthData.NasaEarthDataTestHelpers;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

public sealed class NasaEarthDataClientTests : IDisposable
{
    private static readonly Uri ProtectedUrl = new("https://data.lpdaac.test.local/MOD13A2/granule_001.hdf");

    private readonly string _cacheDirectory = CreateTempCacheDirectory();
    private readonly FakeHttpMessageHandler _handler = new();

    public void Dispose() => TryDeleteDirectory(_cacheDirectory);

    [Fact]
    public async Task DownloadFileAsync_SendsBearerAuthorizationHeader()
    {
        _handler.Enqueue(HttpStatusCode.OK, "hdf-bytes");
        var client = CreateClient(_handler, _cacheDirectory, TestToken);

        var result = await client.DownloadFileAsync(ProtectedUrl, requiresAuthentication: true);

        var request = Assert.Single(_handler.Requests);
        Assert.Equal("Bearer", request.Authorization?.Scheme);
        Assert.Equal(TestToken, request.Authorization?.Parameter);
        Assert.False(result.FromCache);
        Assert.Equal("hdf-bytes", await File.ReadAllTextAsync(result.FilePath));
    }

    [Fact]
    public async Task DownloadFileAsync_WithoutToken_FailsWithClearErrorAndNoRequest()
    {
        var client = CreateClient(_handler, _cacheDirectory, token: null);

        var error = await Assert.ThrowsAsync<NasaEarthDataAuthenticationException>(
            () => client.DownloadFileAsync(ProtectedUrl, requiresAuthentication: true));

        Assert.Contains(NasaEarthDataOptions.TokenEnvironmentVariable, error.Message);
        Assert.Equal(0, _handler.CallCount);
    }

    [Fact]
    public async Task DownloadDatasetAsync_PublicGistemp_WorksWithoutToken()
    {
        _handler.Enqueue(HttpStatusCode.OK, "Year,J-D\n2024,1.28\n", "text/csv");
        var client = CreateClient(_handler, _cacheDirectory, token: null);

        var result = await client.DownloadDatasetAsync(NasaDatasetCatalog.GistempV4);

        var request = Assert.Single(_handler.Requests);
        Assert.Null(request.Authorization);
        Assert.Equal(NasaDatasetCatalog.GistempV4.DirectUrl, request.Uri);
        Assert.EndsWith("GLB.Ts+dSST.csv", result.FilePath);
        Assert.StartsWith(Path.GetFullPath(_cacheDirectory), result.FilePath);
    }

    [Fact]
    public async Task DownloadFileAsync_SecondCall_IsServedFromCacheWithoutRequest()
    {
        _handler.Enqueue(HttpStatusCode.OK, "cached-content");
        var client = CreateClient(_handler, _cacheDirectory, TestToken);

        var first = await client.DownloadFileAsync(ProtectedUrl, requiresAuthentication: true);
        var second = await client.DownloadFileAsync(ProtectedUrl, requiresAuthentication: true);

        Assert.Equal(1, _handler.CallCount);
        Assert.False(first.FromCache);
        Assert.True(second.FromCache);
        Assert.Equal(first.FilePath, second.FilePath);
        Assert.Equal(first.SizeBytes, second.SizeBytes);
    }

    [Fact]
    public async Task DownloadFileAsync_ServerError_ThrowsAndLeavesNoFileInCache()
    {
        _handler.Enqueue(HttpStatusCode.NotFound);
        var client = CreateClient(_handler, _cacheDirectory, TestToken);

        await Assert.ThrowsAsync<NasaEarthDataException>(
            () => client.DownloadFileAsync(ProtectedUrl, requiresAuthentication: true));

        Assert.False(Directory.Exists(_cacheDirectory) && Directory.EnumerateFiles(
            _cacheDirectory, "*", SearchOption.AllDirectories).Any());
    }

    [Fact]
    public async Task SearchGranulesAsync_BuildsCmrQueryAndParsesEntries()
    {
        const string json = """
            {"feed":{"entry":[{"id":"G123-LPCLOUD","title":"MOD13A2.A2024001","granule_size":"12.5",
              "time_start":"2024-01-01T00:00:00.000Z","time_end":"2024-01-16T23:59:59.000Z",
              "links":[{"rel":"http://esipfed.org/ns/fedsearch/1.1/data#","href":"https://data.test.local/a.hdf"},
                       {"rel":"http://esipfed.org/ns/fedsearch/1.1/metadata#","href":"https://data.test.local/a.xml"}]}]}}
            """;
        _handler.Enqueue(HttpStatusCode.OK, json, "application/json");
        var client = CreateClient(_handler, _cacheDirectory, token: null);
        var request = GranuleSearchRequest.For(NasaDatasetCatalog.ModisTerraNdvi) with
        {
            TemporalStart = new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero),
            TemporalEnd = new DateTimeOffset(2024, 2, 1, 0, 0, 0, TimeSpan.Zero),
            PageSize = 10
        };

        var granules = await client.SearchGranulesAsync(request);

        var uri = Assert.Single(_handler.Requests).Uri;
        Assert.Equal("/search/granules.json", uri.AbsolutePath);
        Assert.Contains("short_name=MOD13A2", uri.Query);
        Assert.Contains("version=061", uri.Query);
        Assert.Contains("temporal=2024-01-01T00%3A00%3A00Z%2C2024-02-01T00%3A00%3A00Z", uri.Query);
        var granule = Assert.Single(granules);
        Assert.Equal("G123-LPCLOUD", granule.Id);
        Assert.Equal(12.5, granule.SizeMegabytes);
        Assert.Equal(new Uri("https://data.test.local/a.hdf"), Assert.Single(granule.DataLinks));
    }
}
