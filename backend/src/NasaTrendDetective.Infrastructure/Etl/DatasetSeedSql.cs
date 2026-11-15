namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// Seeding SQL statements. File paths are escaped literals because read_parquet does not
/// accept prepared parameters for the path; everything else is bound by parameter name.
/// </summary>
internal static class DatasetSeedSql
{
    public const string LoadedParquetHash =
        "SELECT parquet_sha256 FROM dataset_provenance WHERE variable_id = $varId";

    public const string DeleteProvenance = "DELETE FROM dataset_provenance WHERE variable_id = $varId";

    public const string DeleteFacts = "DELETE FROM fact_climate_observations WHERE variable_id = $varId";

    public const string CountFacts = "SELECT count(*) FROM fact_climate_observations WHERE variable_id = $varId";

    public const string InsertProvenance = """
        INSERT INTO dataset_provenance (
            variable_id, provider, product, unit, trend_unit, baseline, resolution_degrees,
            source_url, source_file, source_sha256, retrieved_at, coverage_start, coverage_end,
            last_month, interim, citation, parquet_file, parquet_sha256, row_count, loaded_at)
        VALUES (
            $varId, $provider, $product, $unit, $trendUnit, $baseline, $resolution,
            $sourceUrl, $sourceFile, $sourceSha, $retrievedAt, $coverageStart, $coverageEnd,
            $lastMonth, $interim, $citation, $parquetFile, $parquetSha, $rowCount, $loadedAt)
        """;

    public const string UpdateProvenance = """
        UPDATE dataset_provenance
        SET provider = $provider,
            product = $product,
            unit = $unit,
            trend_unit = $trendUnit,
            baseline = $baseline,
            resolution_degrees = $resolution,
            source_url = $sourceUrl,
            source_file = $sourceFile,
            source_sha256 = $sourceSha,
            retrieved_at = $retrievedAt,
            coverage_start = $coverageStart,
            coverage_end = $coverageEnd,
            last_month = $lastMonth,
            interim = $interim,
            citation = $citation,
            parquet_file = $parquetFile,
            parquet_sha256 = $parquetSha,
            row_count = $rowCount,
            loaded_at = $loadedAt
        WHERE variable_id = $varId
        """;

    /// <summary>
    /// Distinct variables present in the Parquet: must contain only the variable declared in the manifest;
    /// otherwise replacing one variable could delete or corrupt facts from another.
    /// </summary>
    public static string DistinctVariables(string parquetPath) =>
        $"SELECT DISTINCT CAST(variable_id AS INTEGER) FROM read_parquet({DuckDbSqlText.Literal(parquetPath)})";
}
