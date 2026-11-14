namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Communication or data integrity error when querying or downloading from NASA EarthData.
/// </summary>
public class NasaEarthDataException : Exception
{
    public NasaEarthDataException(string message)
        : base(message)
    {
    }

    public NasaEarthDataException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

/// <summary>
/// Thrown when an operation requires an Earthdata Login token and none is configured.
/// </summary>
public sealed class NasaEarthDataAuthenticationException : NasaEarthDataException
{
    public NasaEarthDataAuthenticationException()
        : base($"The operation requires an Earthdata Login token. Set the environment variable " +
               $"{NasaEarthDataOptions.TokenEnvironmentVariable} or configuration key " +
               $"{NasaEarthDataOptions.SectionName}:Token (https://urs.earthdata.nasa.gov/profile).")
    {
    }
}
