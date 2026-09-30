namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Error de importación masiva de Parquet: glob sin archivos o esquema distinto al canónico.
/// </summary>
public sealed class ParquetImportException : InvalidOperationException
{
    public ParquetImportException(string message)
        : base(message)
    {
    }

    public ParquetImportException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
