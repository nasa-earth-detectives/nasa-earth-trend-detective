using System.Threading;
using DuckDB.NET.Data;
using Microsoft.Extensions.Options;
using NasaTrendDetective.Infrastructure.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Factory for embedded DuckDB connections. In file mode, each operation opens its own
/// connection (DuckDB.NET shares the underlying database instance per path). In ":memory:" mode,
/// a private anchor connection is kept and duplicated so all connections see the same database.
/// </summary>
public sealed class DuckDbConnectionFactory : IDuckDbConnectionFactory, IDisposable, IAsyncDisposable
{
    private readonly DuckDBConnection? _memoryAnchor;
    private readonly string? _settingsSql;
    private int _limitsApplied;
    private bool _disposed;

    public DuckDbConnectionFactory(IOptions<DuckDbOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var settings = options.Value;
        IsInMemory = settings.IsInMemory;
        ConnectionString = BuildConnectionString(settings);
        _settingsSql = BuildSettingsSql(settings);

        if (IsInMemory)
        {
            _memoryAnchor = new DuckDBConnection(ConnectionString);
            _memoryAnchor.Open();
        }
    }

    public string ConnectionString { get; }

    /// <summary>Validated resource limit SQL statements (interpolated value: SET does not accept parameters).</summary>
    public static string? BuildSettingsSql(DuckDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var statements = new List<string>();
        if (!string.IsNullOrWhiteSpace(options.MemoryLimit))
        {
            var limit = options.MemoryLimit.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(limit, @"^\d+(\.\d+)?\s*(KB|MB|GB|KiB|MiB|GiB)$",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                throw new ArgumentException($"Invalid DuckDb:MemoryLimit: '{limit}'. Example: 256MB.", nameof(options));
            }

            statements.Add($"SET memory_limit = '{limit}'");
            if (!options.IsInMemory || !string.IsNullOrWhiteSpace(options.TempDirectory))
            {
                var temp = Path.GetFullPath(string.IsNullOrWhiteSpace(options.TempDirectory)
                    ? options.DatabasePath.Trim() + ".tmp"
                    : options.TempDirectory.Trim());
                Directory.CreateDirectory(temp);
                statements.Add($"SET temp_directory = '{temp.Replace("'", "''", StringComparison.Ordinal)}'");
            }
        }

        if (options.Threads is { } threads)
        {
            ArgumentOutOfRangeException.ThrowIfLessThan(threads, 1, nameof(options.Threads));
            statements.Add($"SET threads = {threads}");
        }

        return statements.Count == 0 ? null : string.Join("; ", statements) + ";";
    }

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
            await ApplyResourceLimitsAsync(connection, cancellationToken).ConfigureAwait(false);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync().ConfigureAwait(false);
            throw;
        }
    }

    /// <summary>
    /// SET memory_limit/temp_directory/threads apply at DuckDB instance level.
    /// They must only execute on the first connection to avoid 'Cannot switch temporary directory' errors.
    /// </summary>
    private async Task ApplyResourceLimitsAsync(DuckDBConnection connection, CancellationToken cancellationToken)
    {
        if (_settingsSql is null || Interlocked.Exchange(ref _limitsApplied, 1) != 0)
        {
            return;
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = _settingsSql;
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DuckDBException ex) when (ex.Message.Contains("temporary directory", StringComparison.OrdinalIgnoreCase))
        {
            // Ignore if temporary directory was already initialized by another connection/instance.
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
