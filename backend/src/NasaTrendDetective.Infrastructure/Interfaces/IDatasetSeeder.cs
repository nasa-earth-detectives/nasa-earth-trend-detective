using NasaTrendDetective.Infrastructure.Etl.Models;

namespace NasaTrendDetective.Infrastructure.Interfaces;

/// <summary>
/// Carga en DuckDB los pares Parquet + manifiesto de una carpeta. Idempotente: un Parquet ya cargado
/// (mismo SHA-256) no se reimporta; uno distinto reemplaza los hechos de su variable.
/// </summary>
public interface IDatasetSeeder
{
    /// <param name="directory">Carpeta a sembrar; null usa DatasetSeed:Directory.</param>
    Task<IReadOnlyList<DatasetSeedOutcome>> SeedAsync(
        string? directory = null,
        CancellationToken cancellationToken = default);
}
