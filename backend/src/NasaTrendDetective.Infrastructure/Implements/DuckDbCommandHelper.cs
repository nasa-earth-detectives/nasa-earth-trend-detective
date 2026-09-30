using System.Globalization;
using System.Text.RegularExpressions;
using DuckDB.NET.Data;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>
/// Utilidades internas para construir comandos DuckDB seguros y convertir resultados.
/// </summary>
internal static partial class DuckDbCommandHelper
{
    public static DuckDBCommand CreateCommand(
        DuckDBConnection connection,
        string sql,
        IReadOnlyDictionary<string, object?>? parameters)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sql);
        var command = connection.CreateCommand();
        command.CommandText = sql;

        if (parameters is null)
        {
            return command;
        }

        foreach (var (name, value) in parameters)
        {
            command.Parameters.Add(new DuckDBParameter(name.TrimStart('$'), value ?? DBNull.Value));
        }

        return command;
    }

    public static T? ConvertScalar<T>(object? value)
    {
        if (value is null || value is DBNull)
        {
            return default;
        }

        if (value is T typed)
        {
            return typed;
        }

        var target = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
        return (T)Convert.ChangeType(value, target, CultureInfo.InvariantCulture);
    }

    public static string QuoteIdentifier(string identifier)
    {
        if (string.IsNullOrWhiteSpace(identifier) || !IdentifierPattern().IsMatch(identifier))
        {
            throw new ArgumentException(
                $"Nombre de tabla inválido: '{identifier}'. Solo se permiten letras, dígitos y '_'.",
                nameof(identifier));
        }

        return $"\"{identifier}\"";
    }

    [GeneratedRegex("^[A-Za-z_][A-Za-z0-9_]{0,62}$")]
    private static partial Regex IdentifierPattern();
}
