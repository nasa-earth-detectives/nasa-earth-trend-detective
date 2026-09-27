namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Opciones del cliente NASA EarthData (sección "NasaEarthData"). El token Bearer se toma de
/// la variable de entorno NASA_EARTHDATA_TOKEN cuando está definida y nunca se registra en logs.
/// </summary>
public sealed class NasaEarthDataOptions
{
    public const string SectionName = "NasaEarthData";
    public const string TokenEnvironmentVariable = "NASA_EARTHDATA_TOKEN";
    public const string DefaultCmrBaseUrl = "https://cmr.earthdata.nasa.gov/";
    public const string DefaultCacheDirectory = "data/nasa/raw";

    /// <summary>
    /// Token Bearer de Earthdata Login. Opcional: los recursos públicos (p.ej. GISTEMP) no lo requieren.
    /// </summary>
    public string? Token { get; set; }

    public string CmrBaseUrl { get; set; } = DefaultCmrBaseUrl;

    /// <summary>
    /// Directorio de caché en disco para archivos descargados (relativo al directorio de trabajo).
    /// </summary>
    public string CacheDirectory { get; set; } = DefaultCacheDirectory;

    /// <summary>
    /// Hosts adicionales (y sus subdominios) que pueden recibir el token, además de los dominios
    /// de NASA Earthdata por defecto. Solo se envía por HTTPS.
    /// </summary>
    public string[] AdditionalTrustedTokenHosts { get; set; } = [];

    public int MaxRetryAttempts { get; set; } = 4;

    /// <summary>
    /// Retardo base del retroceso exponencial entre reintentos.
    /// </summary>
    public TimeSpan RetryBaseDelay { get; set; } = TimeSpan.FromSeconds(2);

    /// <summary>
    /// Tiempo máximo por intento hasta recibir las cabeceras de respuesta.
    /// </summary>
    public TimeSpan AttemptTimeout { get; set; } = TimeSpan.FromSeconds(60);

    public bool HasToken => !string.IsNullOrWhiteSpace(Token);

    public override string ToString() =>
        $"{nameof(NasaEarthDataOptions)} {{ CmrBaseUrl = {CmrBaseUrl}, CacheDirectory = {CacheDirectory}, HasToken = {HasToken} }}";
}
