namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Error de comunicación o de integridad al consultar/descargar datos de NASA EarthData.
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
/// Se lanza cuando una operación requiere token de Earthdata Login y no hay uno configurado.
/// </summary>
public sealed class NasaEarthDataAuthenticationException : NasaEarthDataException
{
    public NasaEarthDataAuthenticationException()
        : base($"La operación requiere un token de Earthdata Login. Define la variable de entorno " +
               $"{NasaEarthDataOptions.TokenEnvironmentVariable} o la clave " +
               $"{NasaEarthDataOptions.SectionName}:Token (https://urs.earthdata.nasa.gov/profile).")
    {
    }
}
