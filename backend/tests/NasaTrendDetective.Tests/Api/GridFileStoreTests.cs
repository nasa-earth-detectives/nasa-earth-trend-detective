using System.IO.Compression;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NasaTrendDetective.Api.Services;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Tests.Api;

/// <summary>
/// Default trend grids ship with the image as files. A file must only ever be served for the exact
/// dataset it was computed from, and a damaged one must be ignored rather than sent to a browser.
/// </summary>
public sealed class GridFileStoreTests : IDisposable
{
    private readonly string _directory = Path.Combine(Path.GetTempPath(), "grid-store-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_directory))
        {
            Directory.Delete(_directory, recursive: true);
        }
    }

    [Fact]
    public void WrittenGrid_IsReadBackForTheSameDataset()
    {
        var store = NewStore(_directory);
        var body = Brotli("{\"cells\":[1,2,3]}");

        store.Write(Dataset(), body);

        Assert.Equal(body, store.TryRead(Dataset()));
    }

    [Theory]
    [InlineData("other-hash", 729000L, 1981, 2025)]
    [InlineData("abc123", 729001L, 1981, 2025)]
    [InlineData("abc123", 729000L, 1981, 2026)]
    public void GridOfAnotherDatasetVersion_IsNotUsed(string hash, long rows, int start, int end)
    {
        var store = NewStore(_directory);
        store.Write(Dataset(), Brotli("{\"cells\":[]}"));

        Assert.Null(store.TryRead(Dataset(hash, rows, start, end)));
    }

    [Fact]
    public void DamagedFile_IsIgnored()
    {
        var store = NewStore(_directory);
        var body = Brotli(new string('x', 20_000));
        store.Write(Dataset(), body);
        var path = Directory.GetFiles(_directory, "*.json.br").Single();
        File.WriteAllBytes(path, body.AsSpan(0, body.Length / 2).ToArray());

        Assert.Null(store.TryRead(Dataset()));
    }

    [Fact]
    public void WithoutDirectory_TheStoreIsOff()
    {
        var store = NewStore(null);

        store.Write(Dataset(), Brotli("{}"));

        Assert.False(store.Enabled);
        Assert.Null(store.TryRead(Dataset()));
        Assert.False(Directory.Exists(_directory));
    }

    private static GridFileStore NewStore(string? directory)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["GridCache:Directory"] = directory })
            .Build();
        return new GridFileStore(configuration, NullLogger<GridFileStore>.Instance);
    }

    private static DatasetProvenance Dataset(string hash = "abc123", long rows = 729000L, int start = 1981, int end = 2025) =>
        new(ClimateVariable.Merra2Temperature, "NASA", "MERRA-2", "°C", "°C / year", null, 1.0, "https://example.test",
            "t2m.parquet", hash, DateTimeOffset.UnixEpoch, start, end, "2025-12", false, "citation", rows, DateTimeOffset.UnixEpoch);

    private static byte[] Brotli(string text)
    {
        using var output = new MemoryStream();
        using (var stream = new BrotliStream(output, CompressionLevel.Fastest, leaveOpen: true))
        {
            stream.Write(System.Text.Encoding.UTF8.GetBytes(text));
        }

        return output.ToArray();
    }
}
