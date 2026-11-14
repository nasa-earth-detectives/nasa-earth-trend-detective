# Seed Datasets

On startup, the API loads every `<name>.parquet` + `<name>.provenance.json` pair from
this folder into DuckDB (in Docker: `/app/seed`). If the Parquet's SHA-256 hasn't changed, it does not reimport; if
it changed, it replaces the facts for that variable.

| File | Content |
| --- | --- |
| `gistemp_v4.parquet` | GISTEMP v4 (NASA GISS), land-ocean monthly temperature anomaly on a 2° grid, 2000-01 to 2026-08. 5,142,681 rows, 13.4 MB. |
| `gistemp_v4.provenance.json` | Provenance: URL and SHA-256 of the original netCDF, baseline 1951-1980, citation. `interim: true` = interim source until receiving the official challenge source. |

Regenerate (from repository root, with the netCDF in `data/nasa/raw/`):

```bash
python scripts/etl/gistemp_netcdf_to_csv.py --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gistemp_v4.csv --variable Gistemp --output gistemp_v4.parquet
```

Changing the data source: see `docs/obsidian/31-Datos-GISTEMP-Reales-e-Integracion-API.md`.
