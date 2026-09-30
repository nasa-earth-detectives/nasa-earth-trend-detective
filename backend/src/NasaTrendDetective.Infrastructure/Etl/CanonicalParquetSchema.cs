namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Esquema canónico que produce el normalizador (variable_id, latitude, longitude, timestamp, value,
/// anomaly) y validación de las columnas devueltas por DESCRIBE SELECT * FROM read_parquet(...).
/// </summary>
internal static class CanonicalParquetSchema
{
    private enum ColumnKind
    {
        Integer,
        Numeric,
        Temporal,
    }

    private static readonly (string Name, ColumnKind Kind)[] Columns =
    [
        ("variable_id", ColumnKind.Integer),
        ("latitude", ColumnKind.Numeric),
        ("longitude", ColumnKind.Numeric),
        ("timestamp", ColumnKind.Temporal),
        ("value", ColumnKind.Numeric),
        ("anomaly", ColumnKind.Numeric),
    ];

    private static readonly HashSet<string> IntegerTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "TINYINT", "SMALLINT", "INTEGER", "BIGINT", "HUGEINT",
        "UTINYINT", "USMALLINT", "UINTEGER", "UBIGINT",
    };

    private static readonly HashSet<string> FloatingTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "FLOAT", "REAL", "DOUBLE",
    };

    public static IEnumerable<string> ColumnNames => Columns.Select(column => column.Name);

    /// <summary>
    /// Lanza <see cref="ParquetImportException"/> si faltan columnas, sobran o tienen tipos incompatibles.
    /// </summary>
    public static void Validate(IReadOnlyList<(string Name, string Type)> described, string sourceGlob)
    {
        ArgumentNullException.ThrowIfNull(described);
        var actual = described.ToDictionary(c => c.Name, c => c.Type, StringComparer.OrdinalIgnoreCase);
        var errors = new List<string>();

        foreach (var (name, kind) in Columns)
        {
            if (!actual.TryGetValue(name, out var type))
            {
                errors.Add($"falta la columna '{name}'");
            }
            else if (!IsCompatible(type, kind))
            {
                errors.Add($"la columna '{name}' es {type} y se esperaba un tipo {Describe(kind)}");
            }
        }

        var expected = ColumnNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
        errors.AddRange(actual.Keys.Where(name => !expected.Contains(name))
            .Select(name => $"columna no canónica '{name}'"));

        if (errors.Count > 0)
        {
            throw new ParquetImportException(
                $"El Parquet '{sourceGlob}' no cumple el esquema canónico "
                + $"({string.Join(", ", ColumnNames)}): {string.Join("; ", errors)}.");
        }
    }

    private static bool IsCompatible(string type, ColumnKind kind)
    {
        var normalized = type.Trim();
        return kind switch
        {
            ColumnKind.Integer => IntegerTypes.Contains(normalized),
            ColumnKind.Numeric => IntegerTypes.Contains(normalized)
                || FloatingTypes.Contains(normalized)
                || normalized.StartsWith("DECIMAL", StringComparison.OrdinalIgnoreCase),
            _ => normalized.Equals("DATE", StringComparison.OrdinalIgnoreCase)
                || normalized.StartsWith("TIMESTAMP", StringComparison.OrdinalIgnoreCase),
        };
    }

    private static string Describe(ColumnKind kind) => kind switch
    {
        ColumnKind.Integer => "entero",
        ColumnKind.Numeric => "numérico",
        _ => "DATE/TIMESTAMP",
    };
}
