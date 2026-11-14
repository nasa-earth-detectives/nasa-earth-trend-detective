namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Download result: local file path and whether it was served from on-disk cache.
/// </summary>
public sealed record NasaDownloadResult(string FilePath, long SizeBytes, bool FromCache);
