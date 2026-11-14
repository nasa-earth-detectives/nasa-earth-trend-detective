# Seed datasets

On startup, the API loads each `<name>.parquet` + `<name>.provenance.json` pair from this folder (in Docker: `/app/seed`) into DuckDB. If the Parquet SHA-256 has not changed, it skips re-importing; if it changed, it replaces the facts for that variable.

| File | Contents |
| --- | --- |
| `gistemp_v4.parquet` | GISTEMP v4 (NASA GISS), monthly land-ocean anomaly on a 2° grid, 2000-01 to 2026-08. 5,142,681 rows, 13.4 MB. |
| `gistemp_v4.provenance.json` | Provenance: URL and SHA-256 of the original netCDF, 1951-1980 baseline, citation. `interim: true` = provisional source until the official challenge dataset is received. |
| `merra2_t2m.parquet` | MERRA-2 via NASA POWER v10: 2 m air temperature, annual mean 1981-2025 on a 2° grid. 729,000 rows, 4.7 MB. |
| `merra2_precipitation.parquet` | MERRA-2: bias-corrected total precipitation, annual mean 1981-2025. 729,000 rows, 2.9 MB. |
| `merra2_evaporation.parquet` | MERRA-2: land evaporation, annual mean 1981-2025, land cells only. 205,785 rows, 0.7 MB. |
| `merra2_soil_moisture.parquet` | MERRA-2: root-zone soil moisture (0-1), annual mean 1981-2025, land only. 205,785 rows, 0.8 MB. |
| `gpm_imerg_precipitation.parquet` | GPM IMERG via NASA POWER v10: satellite-estimated precipitation, annual mean 1998-2025. 453,600 rows, 1.8 MB. |
| `modis_ndvi.parquet` | MODIS Terra L3 via NASA GIBS: monthly NDVI 2000-03 to 2025-12, 2° cell mean. 1,010,695 rows, 2.4 MB. |
| `grace_mascons.parquet` | GRACE and GRACE-FO, NASA GSFC RL06v2.0 mascons: land water and ice, cm of equivalent water height relative to 2004-2009, monthly 2002-04 to 2025-12, 5,832 2° cells. 1,469,664 rows, 7.0 MB. |
| `oco2_xco2.parquet` | OCO-2 via NASA GIBS: column-averaged XCO₂, annual mean 2015-2025 per 2° cell (a month counts with 3 or more soundings; a year, with 6 or more months). 55,632 rows, 0.13 MB. |
| `merra2_*.provenance.json` | Provenance for each variable: public Zarr URL, SHA-256 of its chunks, 1991-2020 baseline, regridding method, and citation. `interim: false`: MERRA-2 is a source named in the challenge. |

Regenerate (from the repo root, with the netCDF in `data/nasa/raw/`):

```bash
python scripts/etl/gistemp_netcdf_to_csv.py --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gistemp_v4.csv --variable Gistemp --output gistemp_v4.parquet
```

MERRA-2 and GPM IMERG (downloads the public NASA POWER Zarr stores, no account required; requires `pip install numpy numcodecs`):

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

GRACE and GRACE-FO (NASA Goddard mascons, no account required, 58.6 MB; requires `pip install numpy`):

```bash
python scripts/etl/gsfc_mascons_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/grace_mascons.csv --variable GraceMass --output grace_mascons.parquet
```

OCO-2 CO₂ (daily images from the open NASA GIBS WMS, no account required; requires `pip install numpy pillow`; the first run downloads 255 MB in about 50 minutes, subsequent conversions take about 5 minutes):

```bash
python scripts/etl/gibs_oco2_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/oco2_xco2.csv --variable Oco2 --output oco2_xco2.parquet
```

Changing sources: see `docs/obsidian/31-Datos-GISTEMP-Reales-e-Integracion-API.md`. MERRA-2: see
`docs/obsidian/37-MERRA2-Datos-Reales-y-Casos-Opuestos.md`. GRACE and CO₂: see
`docs/obsidian/40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia.md`.
