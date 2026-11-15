using System.Security.Cryptography;
using System.Text;

namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// On-disk cache for downloaded files. A file only appears under its final name once fully
/// written (temporary file + atomic rename), so its existence guarantees completeness.
/// </summary>
public sealed class NasaFileCache
{
    private const string PartialSuffix = ".partial";

    public NasaFileCache(string cacheDirectory)
    {
        if (string.IsNullOrWhiteSpace(cacheDirectory))
        {
            throw new ArgumentException("Cache directory cannot be empty.", nameof(cacheDirectory));
        }

        RootDirectory = Path.GetFullPath(cacheDirectory);
    }

    public string RootDirectory { get; }

    /// <summary>
    /// Deterministic cache path: {root}/{host}/{filename}.
    /// </summary>
    public string ResolvePath(Uri url, string? fileName = null)
    {
        ArgumentNullException.ThrowIfNull(url);
        var name = Sanitize(fileName ?? Uri.UnescapeDataString(Path.GetFileName(url.AbsolutePath)));
        if (string.IsNullOrEmpty(name))
        {
            name = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(url.AbsoluteUri)))[..32];
        }

        return Path.Combine(RootDirectory, Sanitize(url.Host), name);
    }

    public bool TryGetCached(string path, out long sizeBytes)
    {
        var info = new FileInfo(path);
        sizeBytes = info.Exists ? info.Length : 0;
        return info.Exists && info.Length > 0;
    }

    /// <summary>
    /// Streams content into a temporary file and atomically renames it to the destination path.
    /// If expected length is known and does not match, drops the temporary file and throws.
    /// </summary>
    public async Task<long> WriteAtomicAsync(
        string path,
        Stream content,
        long? expectedLength,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var tempPath = $"{path}.{Guid.NewGuid():N}{PartialSuffix}";

        try
        {
            long written;
            await using (var file = new FileStream(
                tempPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
            {
                await content.CopyToAsync(file, cancellationToken).ConfigureAwait(false);
                await file.FlushAsync(cancellationToken).ConfigureAwait(false);
                written = file.Length;
            }

            if (expectedLength is { } expected && expected != written)
            {
                throw new NasaEarthDataException(
                    $"Incomplete download: expected {expected} bytes but received {written}.");
            }

            File.Move(tempPath, path, overwrite: true);
            return written;
        }
        catch
        {
            TryDelete(tempPath);
            throw;
        }
    }

    private static string Sanitize(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(value.Select(c => invalid.Contains(c) ? '_' : c).ToArray()).Trim('.', ' ');
        return cleaned;
    }

    private static void TryDelete(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
