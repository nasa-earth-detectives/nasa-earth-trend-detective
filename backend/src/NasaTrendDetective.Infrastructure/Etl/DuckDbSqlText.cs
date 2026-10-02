using System.Globalization;

namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Escapado de literales e identificadores para SQL DuckDB generado dinámicamente
/// (COPY y read_csv no aceptan parámetros preparados para rutas en todas las posiciones).
/// </summary>
internal static class DuckDbSqlText
{
    public static string Literal(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        if (value.Contains('\0'))
        {
            throw new ArgumentException("El texto no puede contener caracteres nulos.", nameof(value));
        }

        return $"'{value.Replace("'", "''", StringComparison.Ordinal)}'";
    }

    public static string Identifier(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (name.Contains('\0'))
        {
            throw new ArgumentException("El identificador no puede contener caracteres nulos.", nameof(name));
        }

        return $"\"{name.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }

    public static string Number(double value) => value.ToString("R", CultureInfo.InvariantCulture);
}
