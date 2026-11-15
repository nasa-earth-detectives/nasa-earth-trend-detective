using NasaTrendDetective.Domain.Enums;
using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure.Schema;

public sealed class DuckDbSchemaInitializerTests : IDisposable
{
    private readonly DuckDbConnectionFactory _factory = DuckDbTestHelpers.CreateFactory();
    private readonly DuckDbRepository _repository;
    private readonly DuckDbSchemaInitializer _initializer;

    public DuckDbSchemaInitializerTests()
    {
        _repository = new DuckDbRepository(_factory);
        _initializer = new DuckDbSchemaInitializer(_factory);
    }

    public void Dispose() => _factory.Dispose();

    [Fact]
    public void InitSchemaSql_IsEmbeddedAndDocumentsInsertionOrder()
    {
        var sql = DuckDbSchemaScript.InitSchemaSql;

        Assert.Contains("CREATE TABLE IF NOT EXISTS fact_climate_observations", sql);
        Assert.Contains("ORDER BY variable_id, year, latitude, longitude", sql);
    }

    [Fact]
    public async Task InitializeAsync_CreatesStarSchemaTables()
    {
        await _initializer.InitializeAsync();

        var tables = await _repository.QueryAsync(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name",
            record => record.GetString(0));

        Assert.Equal(
            ["dataset_provenance", "dim_location", "dim_time", "dim_variable", "fact_annual_cell", "fact_climate_observations"],
            tables);
    }

    [Fact]
    public async Task InitializeAsync_RunTwice_IsIdempotent()
    {
        await _initializer.InitializeAsync();
        await _initializer.InitializeAsync();

        Assert.Equal(9L, await CountAsync("dim_variable"));
        Assert.Equal((2100L - 1880L + 1L) * 12L, await CountAsync("dim_time"));
    }

    [Fact]
    public async Task InitializeAsync_SeedsVariablesAlignedWithDomainEnum()
    {
        await _initializer.InitializeAsync();

        var variables = await _repository.QueryAsync(
            "SELECT CAST(variable_id AS INTEGER), variable_code FROM dim_variable ORDER BY variable_id",
            record => (Id: record.GetInt32(0), Code: record.GetString(1)));

        var expected = Enum.GetValues<ClimateVariable>().Select(v => ((int)v, v.ToString()));
        Assert.Equal(expected, variables.Select(v => (v.Id, v.Code)));
    }

    [Fact]
    public async Task InitializeAsync_LegacyDatabaseLimitedToFourVariables_IsRebuiltAndAcceptsNewOnes()
    {
        // Database created by a previous version: dim_variable with CHECK 1..4 and an already loaded fact.
        await _repository.ExecuteAsync("""
            CREATE TABLE dim_variable (
                variable_id TINYINT PRIMARY KEY, variable_code VARCHAR NOT NULL UNIQUE,
                variable_name VARCHAR NOT NULL, unit VARCHAR NOT NULL, mission VARCHAR NOT NULL,
                CHECK (variable_id BETWEEN 1 AND 4));
            INSERT INTO dim_variable VALUES (1, 'Gistemp', 'x', 'degC', 'GISS');
            CREATE TABLE fact_climate_observations (
                observation_id BIGINT PRIMARY KEY,
                variable_id TINYINT NOT NULL REFERENCES dim_variable (variable_id),
                latitude DECIMAL(6,3) NOT NULL, longitude DECIMAL(6,3) NOT NULL, year SMALLINT NOT NULL,
                month TINYINT NOT NULL, observation_value DOUBLE, anomaly_value DOUBLE);
            INSERT INTO fact_climate_observations VALUES (1, 1, 10, 20, 2020, 1, 0.5, 0.5);
            """);

        await _initializer.InitializeAsync();

        Assert.Equal(9L, await CountAsync("dim_variable"));
        // Legacy facts are intentionally dropped: seeding reloads them from the Parquet files.
        Assert.Equal(0L, await CountAsync("fact_climate_observations"));
        await _repository.ExecuteAsync(
            "INSERT INTO fact_climate_observations VALUES (1, 8, 10, 20, 2020, 1, 0.5, 0.1)");
        Assert.Equal(1L, await CountAsync("fact_climate_observations"));
    }

    [Fact]
    public async Task InitializeAsync_CurrentDatabase_KeepsTheFactsAlreadyLoaded()
    {
        await _initializer.InitializeAsync();
        await _repository.ExecuteAsync(
            "INSERT INTO fact_climate_observations VALUES (1, 5, 10, 20, 2020, 1, 0.5, 0.1)");

        await _initializer.InitializeAsync();

        Assert.Equal(1L, await CountAsync("fact_climate_observations"));
    }

    [Fact]
    public async Task InitializeAsync_DimTime_DerivesDecadeQuarterAndSeason()
    {
        await _initializer.InitializeAsync();

        var row = await _repository.QueryAsync(
            "SELECT CAST(decade AS INTEGER), CAST(quarter AS INTEGER), season FROM dim_time WHERE year = 1997 AND month = 12",
            record => (Decade: record.GetInt32(0), Quarter: record.GetInt32(1), Season: record.GetString(2)));

        Assert.Equal((1990, 4, "DJF"), Assert.Single(row));
    }

    private Task<long> CountAsync(string table) =>
        _repository.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM {table}");
}
