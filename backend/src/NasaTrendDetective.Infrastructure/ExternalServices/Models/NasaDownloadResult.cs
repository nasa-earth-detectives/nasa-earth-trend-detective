namespace NasaTrendDetective.Infrastructure.ExternalServices.Models;

/// <summary>
/// Resultado de una descarga: ruta local del archivo y si se sirvió desde la caché en disco.
/// </summary>
public sealed record NasaDownloadResult(string FilePath, long SizeBytes, bool FromCache);
