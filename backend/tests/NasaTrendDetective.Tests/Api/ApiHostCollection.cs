namespace NasaTrendDetective.Tests.Api;

/// <summary>
/// Las clases que levantan la API con WebApplicationFactory comparten el mismo archivo DuckDB por
/// defecto; en paralelo, sus inicializaciones de esquema chocan ("Catalog write-write conflict").
/// Una colección de xUnit las ejecuta en serie.
/// </summary>
[CollectionDefinition(Name)]
public sealed class ApiHostCollection
{
    public const string Name = "ApiHost";
}
