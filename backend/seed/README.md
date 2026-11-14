# Datasets sembrados

La API carga en DuckDB, al arrancar, cada par `<nombre>.parquet` + `<nombre>.provenance.json` de
esta carpeta (en Docker: `/app/seed`). Si el SHA-256 del Parquet no cambió, no reimporta; si
cambió, reemplaza los hechos de esa variable.

| Archivo | Contenido |
| --- | --- |
| `gistemp_v4.parquet` | GISTEMP v4 (NASA GISS), anomalía mensual tierra-océano en grilla de 2°, 2000-01 a 2026-08. 5.142.681 filas, 13,4 MB. |
| `gistemp_v4.provenance.json` | Procedencia: URL y SHA-256 del netCDF original, base 1951-1980, cita. `interim: true` = fuente provisional hasta recibir la oficial del reto. |
| `merra2_t2m.parquet` | MERRA-2 vía NASA POWER v10: temperatura del aire a 2 m, media anual 1981-2025 en grilla de 2°. 729.000 filas, 4,7 MB. |
| `merra2_precipitation.parquet` | MERRA-2: precipitación total corregida, media anual 1981-2025. 729.000 filas, 2,9 MB. |
| `merra2_evaporation.parquet` | MERRA-2: evaporación en tierra, media anual 1981-2025, sólo celdas de tierra. 205.785 filas, 0,7 MB. |
| `merra2_soil_moisture.parquet` | MERRA-2: humedad del suelo en la zona de raíces (0-1), media anual 1981-2025, sólo tierra. 205.785 filas, 0,8 MB. |
| `gpm_imerg_precipitation.parquet` | GPM IMERG vía NASA POWER v10: precipitación estimada por satélite, media anual 1998-2025. 453.600 filas, 1,8 MB. |
| `modis_ndvi.parquet` | MODIS Terra L3 vía NASA GIBS: NDVI mensual 2000-03 a 2025-12, media por celda de 2°. 1.010.695 filas, 2,4 MB. |
| `grace_mascons.parquet` | GRACE y GRACE-FO, mascons de NASA GSFC RL06v2.0: agua y hielo en tierra, cm de agua equivalente respecto a 2004-2009, mensual 2002-04 a 2025-12, 5.832 celdas de 2°. 1.469.664 filas, 7,0 MB. |
| `oco2_xco2.parquet` | OCO-2 vía NASA GIBS: XCO₂ medio de la columna, media anual 2015-2025 por celda de 2° (un mes cuenta con 3 sondeos o más; un año, con 6 meses o más). 55.632 filas, 0,13 MB. |
| `merra2_*.provenance.json` | Procedencia de cada variable: URL del Zarr público, SHA-256 de sus bloques, base 1991-2020, cómo se regrilló y cita. `interim: false`: MERRA-2 es una fuente que nombra el reto. |

Regenerar (desde la raíz del repo, con el netCDF en `data/nasa/raw/`):

```bash
python scripts/etl/gistemp_netcdf_to_csv.py --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gistemp_v4.csv --variable Gistemp --output gistemp_v4.parquet
```

MERRA-2 y GPM IMERG (descarga los Zarr públicos de NASA POWER, sin cuenta; requiere `pip install numpy numcodecs`):

```bash
python scripts/etl/nasa_power_zarr_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_t2m.csv --variable Merra2Temperature --output merra2_t2m.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_precipitation.csv --variable Merra2Precipitation --output merra2_precipitation.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_evaporation.csv --variable Merra2Evaporation --output merra2_evaporation.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/merra2_soil_moisture.csv --variable Merra2SoilMoisture --output merra2_soil_moisture.parquet
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gpm_imerg_precipitation.csv --variable GpmPrecipitation --output gpm_imerg_precipitation.parquet
```

NDVI de MODIS (teselas abiertas de NASA GIBS, sin cuenta; requiere `pip install numpy pillow`):

```bash
python scripts/etl/gibs_ndvi_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/modis_ndvi.csv --variable ModisNdvi --output modis_ndvi.parquet
```

GRACE y GRACE-FO (mascons de NASA Goddard, sin cuenta, 58,6 MB; requiere `pip install numpy`):

```bash
python scripts/etl/gsfc_mascons_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/grace_mascons.csv --variable GraceMass --output grace_mascons.parquet
```

CO₂ de OCO-2 (imágenes diarias del WMS abierto de NASA GIBS, sin cuenta; requiere `pip install numpy pillow`;
la primera vez descarga 255 MB en unos 50 minutos, después la conversión tarda unos 5):

```bash
python scripts/etl/gibs_oco2_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/oco2_xco2.csv --variable Oco2 --output oco2_xco2.parquet
```

Cambiar de fuente: ver `docs/obsidian/31-Datos-GISTEMP-Reales-e-Integracion-API.md`. MERRA-2: ver
`docs/obsidian/37-MERRA2-Datos-Reales-y-Casos-Opuestos.md`. GRACE y CO₂: ver
`docs/obsidian/40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia.md`.
