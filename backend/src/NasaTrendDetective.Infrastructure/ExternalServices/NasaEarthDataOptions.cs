namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// NASA EarthData client options ("NasaEarthData" section). Bearer tokens are retrieved
/// from NASA_EARTHDATA_TOKEN environment variable when defined and are never written to logs.
/// </summary>
public sealed class NasaEarthDataOptions
{
    public const string SectionName = "NasaEarthData";
    public const string TokenEnvironmentVariable = "NASA_EARTHDATA_TOKEN";
    public const string DefaultCmrBaseUrl = "https://cmr.earthdata.nasa.gov/";
    public const string DefaultCacheDirectory = "data/nasa/raw";

    /// <summary>
    /// Earthdata Login Bearer token. Optional: public resources (e.g. GISTEMP) do not require it.
    /// </summary>
    public string? Token { get; set; }

    public string CmrBaseUrl { get; set; } = DefaultCmrBaseUrl;

    /// <summary>
    /// Disk cache directory for downloaded files (relative to working directory).
    /// </summary>
    public string CacheDirectory { get; set; } = DefaultCacheDirectory;

    /// <summary>
    /// Additional hosts (and subdomains) authorized to receive the token, beyond default
    /// NASA Earthdata domains. Only transmitted over HTTPS.
    /// </summary>
    public string[] AdditionalTrustedTokenHosts { get; set; } = [];

    public int MaxRetryAttempts { get; set; } = 4;

    /// <summary>
    /// Base delay for exponential backoff between retries.
    /// </summary>
    public TimeSpan RetryBaseDelay { get; set; } = TimeSpan.FromSeconds(2);

    /// <summary>
    /// Maximum time per attempt until response headers are received.
    /// </summary>
    public TimeSpan AttemptTimeout { get; set; } = TimeSpan.FromSeconds(60);

    public bool HasToken => !string.IsNullOrWhiteSpace(Token);

    public override string ToString() =>
        $"{nameof(NasaEarthDataOptions)} {{ CmrBaseUrl = {CmrBaseUrl}, CacheDirectory = {CacheDirectory}, HasToken = {HasToken} }}";
}
