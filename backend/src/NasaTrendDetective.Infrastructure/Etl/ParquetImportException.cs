namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Parquet bulk import error: glob matches no files or schema does not match canonical definition.
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
