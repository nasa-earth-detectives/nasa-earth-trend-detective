# Seeded Datasets

At startup, the API loads every `<name>.parquet` + `<name>.provenance.json` pair from this folder
(in Docker: `/app/seed`) into DuckDB. If the Parquet SHA-256 has not changed, it skips re-importing;
if it changed, it replaces the facts for that variable.

| File | Contents |
| --- | --- |
| `gistemp_v4.parquet` | GISTEMP v4 (NASA GISS), monthly land-ocean anomaly on a 2° grid, 2000-01 to 2026-08. 5,142,681 rows, 13.4 MB. |
| `gistemp_v4.provenance.json` | Provenance: URL and SHA-256 of the original netCDF, 1951-1980 baseline, citation. `interim: true` = interim source until receiving the official challenge source. |
| `merra2_t2m.parquet` | MERRA-2 via NASA POWER v10: 2 m air temperature, annual mean 1981-2025 on a 2° grid. 729,000 rows, 4.7 MB. |
| `merra2_precipitation.parquet` | MERRA-2: corrected total precipitation, annual mean 1981-2025. 729,000 rows, 2.9 MB. |
| `merra2_evaporation.parquet` | MERRA-2: land evaporation, annual mean 1981-2025, land cells only. 205,785 rows, 0.7 MB. |
| `merra2_soil_moisture.parquet` | MERRA-2: root-zone soil moisture (0-1), annual mean 1981-2025, land cells only. 205,785 rows, 0.8 MB. |
| `gpm_imerg_precipitation.parquet` | GPM IMERG via NASA POWER v10: satellite-estimated precipitation, annual mean 1998-2025. 453,600 rows, 1.8 MB. |
| `modis_ndvi.parquet` | MODIS Terra L3 via NASA GIBS: monthly NDVI 2000-03 to 2025-12, 2° cell mean. 1,010,695 rows, 2.4 MB. |
| `merra2_*.provenance.json` | Provenance for each variable: public Zarr URL, SHA-256 of its chunks, 1991-2020 baseline, regridding method, and citation. `interim: false`: MERRA-2 is a source named by the challenge. |

Regenerate (from the repo root, with the netCDF in `data/nasa/raw/`):

```bash
python scripts/etl/gistemp_netcdf_to_csv.py --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gistemp_v4.csv --variable Gistemp --output gistemp_v4.parquet
```

MERRA-2 and GPM IMERG (downloads public NASA POWER Zarr stores, no account required; requires `pip install numpy numcodecs`):

```bash
python scripts/etl/nasa_power_zarr_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_t2m.csv --variable Merra2Temperature --output merra2_t2m.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_precipitation.csv --variable Merra2Precipitation --output merra2_precipitation.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_evaporation.csv --variable Merra2Evaporation --output merra2_evaporation.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_soil_moisture.csv --variable Merra2SoilMoisture --output merra2_soil_moisture.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gpm_imerg_precipitation.csv --variable GpmPrecipitation --output gpm_imerg_precipitation.parquet
```

MODIS NDVI (open NASA GIBS tiles, no account required; requires `pip install numpy pillow`):

```bash
python scripts/etl/gibs_ndvi_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/modis_ndvi.csv --variable ModisNdvi --output modis_ndvi.parquet
```

Switching sources: see `docs/obsidian/31-Datos-GISTEMP-Reales-e-Integracion-API.md`. MERRA-2: see
`docs/obsidian/37-MERRA2-Datos-Reales-y-Casos-Opuestos.md`.
