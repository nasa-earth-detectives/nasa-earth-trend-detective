# Datasets sembrados

La API carga en DuckDB, al arrancar, cada par `<nombre>.parquet` + `<nombre>.provenance.json` de
esta carpeta (en Docker: `/app/seed`). Si el SHA-256 del Parquet no cambió, no reimporta; si
cambió, reemplaza los hechos de esa variable.

| Archivo | Contenido |
| --- | --- |
| `gistemp_v4.parquet` | GISTEMP v4 (NASA GISS), anomalía mensual tierra-océano en grilla de 2°, 2000-01 a 2026-08. 5.142.681 filas, 13,4 MB. |
| `gistemp_v4.provenance.json` | Procedencia: URL y SHA-256 del netCDF original, base 1951-1980, cita. `interim: true` = fuente provisional hasta recibir la oficial del reto. |

Regenerar (desde la raíz del repo, con el netCDF en `data/nasa/raw/`):

```bash
python scripts/etl/gistemp_netcdf_to_csv.py --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gistemp_v4.csv --variable Gistemp --output gistemp_v4.parquet
```

Cambiar de fuente: ver `docs/obsidian/31-Datos-GISTEMP-Reales-e-Integracion-API.md`.
