using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Etl.Models;

/// <summary>
/// Normalization request for a raw dataset file into canonical WGS84 grid.
/// </summary>
/// <param name="SourcePath">Path to raw file (currently CSV; NetCDF/HDF5 are extension points).</param>
/// <param name="Variable">Climate variable; defines the output variable_id.</param>
/// <param name="Mapping">Explicit column mapping; if null, configured mapping for the variable is used.</param>
/// <param name="OutputFileName">Output Parquet file name; defaults to "{variable}_{origin}.parquet".</param>
public sealed record GridNormalizationRequest(
    string SourcePath,
    ClimateVariable Variable,
    GridColumnMapping? Mapping = null,
    string? OutputFileName = null);
