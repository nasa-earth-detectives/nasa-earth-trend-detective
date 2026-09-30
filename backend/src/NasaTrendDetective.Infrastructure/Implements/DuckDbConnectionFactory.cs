using DuckDB.NET.Data;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Fábrica de conexiones DuckDB embebidas. En modo archivo cada operación abre su propia
/// conexión (DuckDB.NET comparte la instancia de base por ruta). En modo ":memory:" se mantiene
/// una conexión ancla privada y se entregan duplicados para que todas vean la misma base.
/// </summary>
public sealed class DuckDbConnectionFactory : IDuckDbConnectionFactory, IDisposable, IAsyncDisposable
{
    private readonly DuckDBConnection? _memoryAnchor;
    private bool _disposed;

    public DuckDbConnectionFactory(IOptions<DuckDbOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var settings = options.Value;
        IsInMemory = settings.IsInMemory;
        ConnectionString = BuildConnectionString(settings);

        if (IsInMemory)
        {
            _memoryAnchor = new DuckDBConnection(ConnectionString);
            _memoryAnchor.Open();
        }
    }

    public string ConnectionString { get; }

    public bool IsInMemory { get; }

    public static string BuildConnectionString(DuckDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (options.IsInMemory)
        {
            return $"Data Source={DuckDbOptions.InMemoryPath}";
        }

        var fullPath = Path.GetFullPath(options.DatabasePath.Trim());
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        return $"Data Source={fullPath}";
    }

    public async Task<DuckDBConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        cancellationToken.ThrowIfCancellationRequested();

        var connection = _memoryAnchor is not null
            ? _memoryAnchor.Duplicate()
            : new DuckDBConnection(ConnectionString);

        try
        {
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync().ConfigureAwait(false);
            throw;
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _memoryAnchor?.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        if (_memoryAnchor is not null)
        {
            await _memoryAnchor.DisposeAsync().ConfigureAwait(false);
        }
    }
}
