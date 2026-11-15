using System.Security.Cryptography;
using NasaTrendDetective.Domain.Entities;

namespace NasaTrendDetective.Api.Services;

/// <summary>
/// Default trend grids kept as files, so they can be computed when the image is built and shipped
/// with it, next to the database they were computed from.
///
/// Why: computing the nine default grids at startup took 38.6 s on a quarter of a CPU and left the
/// process at about 270-340 MB of a 512 MB container (measured). From there, a single grid for another
/// period was enough to get the container killed for lack of memory. Read from disk they are 1.6 MB in
/// total, ready the moment the process starts, and the heavy queries never run on the host.
///
/// A file is only used for the exact dataset it was computed from: its name carries the coverage, the
/// source hash and the row count. Each file has its SHA-256 beside it, because a truncated Brotli body
/// expands without any error and would reach the browser as a broken response. Anything that does not
/// match is ignored and the grid is computed as before.
/// Disabled when GridCache:Directory is not configured (local development).
/// </summary>
public sealed class GridFileStore
{
    private const string ChecksumSuffix = ".sha256";

    private readonly string? _directory;
    private readonly ILogger<GridFileStore> _logger;

    public GridFileStore(IConfiguration configuration, ILogger<GridFileStore> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        var directory = configuration["GridCache:Directory"];
        _directory = string.IsNullOrWhiteSpace(directory) ? null : directory;
    }

    public bool Enabled => _directory is not null;

    /// <summary>Compressed body of the dataset's default grid, or null if there is no usable file.</summary>
    public byte[]? TryRead(DatasetProvenance provenance)
    {
        ArgumentNullException.ThrowIfNull(provenance);
        if (_directory is null)
        {
            return null;
        }

        var path = PathFor(provenance);
        try
        {
            if (!File.Exists(path) || !File.Exists(path + ChecksumSuffix))
            {
                return null;
            }

            var body = File.ReadAllBytes(path);
            if (body.Length > 0 && Checksum(body) == File.ReadAllText(path + ChecksumSuffix).Trim())
            {
                return body;
            }

            _logger.LogWarning("Shipped trend grid {Path} does not match its checksum; it will be computed.", path);
            return null;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogWarning(ex, "Shipped trend grid {Path} is not usable; it will be computed.", path);
            return null;
        }
    }

    public void Write(DatasetProvenance provenance, byte[] brotli)
    {
        ArgumentNullException.ThrowIfNull(provenance);
        ArgumentNullException.ThrowIfNull(brotli);
        if (_directory is null)
        {
            return;
        }

        Directory.CreateDirectory(_directory);
        var path = PathFor(provenance);
        // Written aside and renamed, so an interrupted build never leaves half a file under the final name.
        var temporary = path + ".tmp";
        File.WriteAllBytes(temporary, brotli);
        File.Move(temporary, path, overwrite: true);
        File.WriteAllText(path + ChecksumSuffix, Checksum(brotli));
    }

    private static string Checksum(byte[] body) => Convert.ToHexString(SHA256.HashData(body));

    private string PathFor(DatasetProvenance provenance)
    {
        var hash = new string(provenance.SourceSha256.Where(char.IsAsciiLetterOrDigit).Take(16).ToArray());
        var name = FormattableString.Invariant(
            $"grid_{(int)provenance.Variable}_{provenance.CoverageStart}_{provenance.CoverageEnd}_{hash}_{provenance.RowCount}.json.br");
        return Path.Combine(_directory!, name);
    }
}
