using NasaTrendDetective.Infrastructure.Implements;

namespace NasaTrendDetective.Tests.Infrastructure.Schema;

public sealed class DuckDbSchemaColumnTests : IDisposable
{
    private readonly DuckDbConnectionFactory _factory = DuckDbTestHelpers.CreateFactory();
    private readonly DuckDbRepository _repository;

    public DuckDbSchemaColumnTests() => _repository = new DuckDbRepository(_factory);

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task FactTable_HasExpectedColumnTypes()
    {
        await new DuckDbSchemaInitializer(_factory).InitializeAsync();

        var columns = await _repository.QueryAsync(
            "SELECT column_name, data_type FROM information_schema.columns " +
            "WHERE table_name = 'fact_climate_observations' ORDER BY ordinal_position",
            record => (Name: record.GetString(0), Type: record.GetString(1)));

        Assert.Equal(
            [
                ("observation_id", "BIGINT"),
                ("variable_id", "TINYINT"),
                ("latitude", "DECIMAL(6,3)"),
                ("longitude", "DECIMAL(6,3)"),
                ("year", "SMALLINT"),
                ("month", "TINYINT"),
                ("observation_value", "DOUBLE"),
                ("anomaly_value", "DOUBLE")
            ],
            columns);
    }

    [Fact]
    public async Task FactTable_RejectsUnknownVariableAndInvalidMonth()
    {
        await new DuckDbSchemaInitializer(_factory).InitializeAsync();

        await _repository.ExecuteAsync(
            "INSERT INTO fact_climate_observations VALUES (1, 1, 4.711, -74.072, 2020, 1, 14.2, 0.9)");

        await Assert.ThrowsAnyAsync<Exception>(() => _repository.ExecuteAsync(
            "INSERT INTO fact_climate_observations VALUES (2, 9, 0, 0, 2020, 1, 1, 1)"));
        await Assert.ThrowsAnyAsync<Exception>(() => _repository.ExecuteAsync(
            "INSERT INTO fact_climate_observations VALUES (3, 1, 0, 0, 2020, 13, 1, 1)"));
        Assert.Equal(1L, await _repository.ExecuteScalarAsync<long>(
            "SELECT COUNT(*) FROM fact_climate_observations"));
    }

    [Fact]
    public async Task HostedService_StartAsync_InitializesSchema()
    {
        var hostedService = new DuckDbSchemaHostedService(new DuckDbSchemaInitializer(_factory));

        await hostedService.StartAsync(CancellationToken.None);
        await hostedService.StopAsync(CancellationToken.None);

        Assert.Equal(4L, await _repository.ExecuteScalarAsync<long>("SELECT COUNT(*) FROM dim_variable"));
    }
}
