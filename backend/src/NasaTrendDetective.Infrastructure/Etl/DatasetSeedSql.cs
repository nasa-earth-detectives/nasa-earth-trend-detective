namespace NasaTrendDetective.Infrastructure.Etl;

/// <summary>
/// SQL del sembrado. Las rutas van como literal escapado porque read_parquet no acepta parámetros
/// preparados para la ruta; todo lo demás se enlaza por nombre.
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

    /// <summary>
    /// Variables presentes en el Parquet: debe contener solo la del manifiesto, o reemplazar una
    /// variable borraría o mezclaría hechos de otra.
    /// </summary>
    public static string DistinctVariables(string parquetPath) =>
        $"SELECT DISTINCT CAST(variable_id AS INTEGER) FROM read_parquet({DuckDbSqlText.Literal(parquetPath)})";
}
