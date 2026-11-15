using System.Globalization;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Escaping of literals and identifiers for dynamically generated DuckDB SQL
/// (COPY and read_csv do not accept prepared parameters for paths across all positions).
/// </summary>
internal static class DuckDbSqlText
{
    public static string Literal(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        if (value.Contains('\0'))
        {
            throw new ArgumentException("Text cannot contain null characters.", nameof(value));
        }

        return $"'{value.Replace("'", "''", StringComparison.Ordinal)}'";
    }

    public static string Identifier(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (name.Contains('\0'))
        {
            throw new ArgumentException("Identifier cannot contain null characters.", nameof(name));
        }

        return $"\"{name.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }

    public static string Number(double value) => value.ToString("R", CultureInfo.InvariantCulture);
}
