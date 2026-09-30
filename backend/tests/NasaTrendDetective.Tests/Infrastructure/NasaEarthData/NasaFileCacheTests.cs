using System.Text;
using NasaTrendDetective.Infrastructure.ExternalServices;
using static NasaTrendDetective.Tests.Infrastructure.NasaEarthData.NasaEarthDataTestHelpers;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

public sealed class NasaFileCacheTests : IDisposable
{
    private readonly string _cacheDirectory = CreateTempCacheDirectory();

    public void Dispose() => TryDeleteDirectory(_cacheDirectory);

    [Fact]
    public void ResolvePath_UsesHostFolderAndFileName()
    {
        var cache = new NasaFileCache(_cacheDirectory);

        var path = cache.ResolvePath(new Uri("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"));

        Assert.Equal(Path.Combine(Path.GetFullPath(_cacheDirectory), "data.giss.nasa.gov", "GLB.Ts+dSST.csv"), path);
    }

    [Fact]
    public void ResolvePath_WithoutFileName_UsesStableHash()
    {
        var cache = new NasaFileCache(_cacheDirectory);
        var url = new Uri("https://data.test.local/");

        Assert.Equal(cache.ResolvePath(url), cache.ResolvePath(url));
        Assert.Equal(32, Path.GetFileName(cache.ResolvePath(url)).Length);
    }

    [Fact]
    public async Task WriteAtomicAsync_WritesFinalFileWithoutLeftovers()
    {
        var cache = new NasaFileCache(_cacheDirectory);
        var path = cache.ResolvePath(new Uri("https://data.test.local/file.bin"));
        using var content = new MemoryStream(Encoding.UTF8.GetBytes("payload"));

        var written = await cache.WriteAtomicAsync(path, content, expectedLength: 7);

        Assert.Equal(7, written);
        Assert.True(cache.TryGetCached(path, out var size));
        Assert.Equal(7, size);
        Assert.Single(Directory.GetFiles(Path.GetDirectoryName(path)!));
    }

    [Fact]
    public async Task WriteAtomicAsync_LengthMismatch_DiscardsTemporaryFile()
    {
        var cache = new NasaFileCache(_cacheDirectory);
        var path = cache.ResolvePath(new Uri("https://data.test.local/truncated.bin"));
        using var content = new MemoryStream(Encoding.UTF8.GetBytes("abc"));

        await Assert.ThrowsAsync<NasaEarthDataException>(
            () => cache.WriteAtomicAsync(path, content, expectedLength: 10));

        Assert.False(cache.TryGetCached(path, out _));
        Assert.Empty(Directory.GetFiles(Path.GetDirectoryName(path)!));
    }
}
