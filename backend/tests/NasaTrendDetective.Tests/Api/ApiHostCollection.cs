namespace NasaTrendDetective.Tests.Api;

/// <summary>
/// Classes that spin up the API with WebApplicationFactory share the same DuckDB file by
/// default; running in parallel, their schema initializations clash ("Catalog write-write conflict").
/// An xUnit collection executes them serially.
/// </summary>
[CollectionDefinition(Name)]
public sealed class ApiHostCollection
{
    public const string Name = "ApiHost";
}
