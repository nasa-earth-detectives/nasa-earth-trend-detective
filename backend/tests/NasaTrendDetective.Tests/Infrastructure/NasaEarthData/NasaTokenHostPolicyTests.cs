using System.Net;
using NasaTrendDetective.Infrastructure.ExternalServices;
using NasaTrendDetective.Infrastructure.ExternalServices.Models;
using static NasaTrendDetective.Tests.Infrastructure.NasaEarthData.NasaEarthDataTestHelpers;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

public sealed class NasaTokenHostPolicyTests : IDisposable
{
    private readonly string _cacheDirectory = CreateTempCacheDirectory();
    private readonly FakeHttpMessageHandler _handler = new();

    public void Dispose() => TryDeleteDirectory(_cacheDirectory);

    [Theory]
    [InlineData("https://data.lpdaac.earthdatacloud.nasa.gov/file.hdf", true)]
    [InlineData("https://urs.earthdata.nasa.gov/", true)]
    [InlineData("https://oco2.gesdisc.eosdis.nasa.gov/data/x.nc4", true)]
    [InlineData("http://data.lpdaac.earthdatacloud.nasa.gov/file.hdf", false)]
    [InlineData("https://earthdata.nasa.gov.evil.example/file.hdf", false)]
    [InlineData("https://evilearthdata.nasa.gov/file.hdf", false)]
    [InlineData("https://data.giss.nasa.gov/gistemp/x.csv", false)]
    public void IsTrusted_OnlyAcceptsHttpsEarthdataDomains(string url, bool expected)
    {
        Assert.Equal(expected, NasaTokenHostPolicy.IsTrusted(new Uri(url), []));
    }

    [Fact]
    public void IsTrusted_AcceptsConfiguredAdditionalHosts()
    {
        Assert.True(NasaTokenHostPolicy.IsTrusted(new Uri("https://data.custom.example/a"), ["custom.example"]));
    }

    [Fact]
    public async Task DownloadFileAsync_UntrustedHost_ThrowsWithoutSendingRequest()
    {
        var client = CreateClient(_handler, _cacheDirectory, TestToken);

        await Assert.ThrowsAsync<NasaEarthDataException>(() => client.DownloadFileAsync(
            new Uri("https://files.example.org/granule.hdf"), requiresAuthentication: true));

        Assert.Equal(0, _handler.CallCount);
    }

    [Fact]
    public async Task PublicRequests_NeverCarryTheToken()
    {
        _handler.Enqueue(HttpStatusCode.OK, """{"feed":{"entry":[]}}""", "application/json");
        _handler.Enqueue(HttpStatusCode.OK, "Year,J-D\n2024,1.28\n", "text/csv");
        var client = CreateClient(_handler, _cacheDirectory, TestToken);

        await client.SearchGranulesAsync(GranuleSearchRequest.For(NasaDatasetCatalog.ModisTerraNdvi));
        await client.DownloadDatasetAsync(NasaDatasetCatalog.GistempV4);

        Assert.Equal(2, _handler.CallCount);
        Assert.All(_handler.Requests, request => Assert.Null(request.Authorization));
    }
}
