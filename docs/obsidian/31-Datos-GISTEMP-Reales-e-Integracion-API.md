# Datos GISTEMP reales e integración API ↔ frontend

Volver al [[00-Map-Of-Content]] · Capas de observación: `docs/s2-t4-observation-layers.md`
· Superficie: [[30-Detalle-Satelital-por-Mosaicos-LOD]]

## Alcance

La temperatura deja de ser sintética: el backend carga **GISTEMP v4** (NASA GISS) en DuckDB y
el frontend lo consume. Las otras tres variables (NDVI, GRACE, OCO-2) siguen con datos de
demostración **rotulados** hasta tener token de EarthData.

GISTEMP se descarga hoy del sitio público de GISS. El reto entregará su fuente oficial más
adelante, así que la cadena está hecha para **cambiar de fuente sin tocar la API ni el
frontend**: basta con otro manifiesto y otro Parquet.

## La cadena

```text
netCDF de GISS ──(Python)──► CSV canónico + manifiesto de procedencia
CSV ──(EtlCli normalize = SpatialGridNormalizer)──► Parquet SNAPPY canónico
Parquet + manifiesto ──(API al arrancar, o EtlCli seed)──► DuckDB: fact_climate_observations + dataset_provenance
DuckDB ──► /api/datasets · /api/trends/grid · /api/trends · /api/trends/observations ──► frontend (modo auto)
```

| Pieza | Archivo |
| --- | --- |
| Conversor de la fuente (único paso específico de GISTEMP) | `scripts/etl/gistemp_netcdf_to_csv.py` |
| Herramienta de consola | `backend/tools/NasaTrendDetective.EtlCli` |
| Manifiesto | `Infrastructure/Etl/DatasetManifest.cs` |
| Sembrado idempotente | `Infrastructure/Etl/DatasetSeeder.cs` + `Implements/DatasetSeedHostedService.cs` |
| Tabla de procedencia | `Scripts/init_schema.sql` → `dataset_provenance` |
| Grilla de tendencias | `Application/Implements/GridTrendService.cs` + `Infrastructure/Implements/GridTrendRepository.cs` |
| Catálogo | `Application/Implements/DatasetCatalogService.cs` + `Api/Controllers/DatasetsController.cs` |

Los datos crudos (`data/nasa/`) no se versionan. El par publicado (`gistemp_v4.parquet`, 13,4 MB, y su
manifiesto) sí: vive en `backend/seed/`, que es lo que la API siembra en local y dentro de la imagen
Docker (Render construye sólo con `./backend`).

## Cómo reproducirlo en local

Desde la raíz del repo:

```bash
python scripts/etl/gistemp_netcdf_to_csv.py --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/gistemp_v4.csv --variable Gistemp --output gistemp_v4.parquet
dotnet run --project backend/src/NasaTrendDetective.Api
```

El conversor escribe el manifiesto y `normalize` el Parquet directamente en `backend/seed/`. La
API, en entorno `Development`, siembra sola desde ahí (`appsettings.Development.json`). Ojo:
`dotnet run` de un proyecto **web** ejecuta con el directorio del proyecto como carpeta de
trabajo, mientras que la herramienta de consola usa la carpeta desde donde se lanza. Por eso la
ruta de desarrollo es `../../seed`. En Docker: `DATASET_SEED_DIRECTORY=/app/seed`.

## Cambiar de fuente cuando llegue la oficial

1. Escribir un conversor que produzca un CSV con columnas `lat, lon, time (AAAA-MM-01), value, anomaly`.
2. Escribir junto a él un `<nombre>.provenance.json` con los mismos campos que el de GISTEMP:
   `variable`, `provider`, `product`, `baseline`, `unit`, `trendUnit`, `interim` (pasa a `false`
   con la fuente oficial), `resolutionDegrees`, `sourceUrl`, `sourceFile`, `sourceSha256`,
   `retrievedAt`, `coverageStart`, `coverageEnd`, `lastMonth` y `citation`.
3. `EtlCli normalize` → `<nombre>.parquet` en `backend/seed/`, junto al manifiesto.
4. Reiniciar la API. Si el SHA-256 del Parquet cambió, **reemplaza** los hechos de esa variable
   (no los mezcla). Si no cambió, no hace nada.

El orden del sembrado garantiza que nunca queda una procedencia apuntando a hechos a medio
cargar: se borra la procedencia, se borran los hechos, se importa y se registra la procedencia.
Si algo falla a mitad, la variable queda "synthetic" y el siguiente arranque reintenta. Un
Parquet que trae otro `variable_id` que el del manifiesto se rechaza sin tocar nada.

## API

| Ruta | Qué devuelve |
| --- | --- |
| `GET /api/datasets` | Las 4 variables con `status` `observed` o `synthetic` y su procedencia. |
| `GET /api/trends/grid?variable&startYear&endYear` | Mann-Kendall / Sen de cada celda observada: `{unit, resolutionDegrees, provider, product, interim, minMonthsPerYear, minYearsPerCell, cells[]}`. **404** si la variable no tiene dataset: no se inventa una grilla. |
| `GET /api/trends?…&latitude&longitude` | Igual que antes, más `source`. Con dataset cargado, una celda sin datos devuelve serie vacía en vez de una sintética. |
| `GET /api/trends/observations?variable&year` | **Corregido**: una fila por celda (media de los meses) con id `Variable:año:lat:lon`. Antes devolvía una fila por mes con `LIMIT 5000`: celdas repetidas hasta 12 veces y la grilla recortada. |

Reglas de inclusión (en `GridTrendService`, también aplicadas a la serie de una celda):

- Un año cuenta si tiene **al menos 9 de 12 meses** válidos. Así el año en curso (2026, de enero
  a agosto) no se compara con años completos. Es una regla del proyecto, no una norma citada.
- Una celda entra en la grilla con **al menos 10 años** (aproximación normal de Mann-Kendall).

Respuestas comprimidas con Brotli o Gzip (`Program.cs`).

## Frontend

- `VITE_OBSERVATION_DATA_SOURCE` y `VITE_HEX_DATA_SOURCE` aceptan `auto` (predeterminado),
  `demo` o `api`. En `auto` se consulta `/api/datasets` y la API atiende solo las variables con
  dataset real.
- Sin API (o si tarda más de 6 s) todo cae a la demo, rotulada "Datos simulados", y se reintenta
  al minuto. Comprobado parando el backend.
- La etiqueta de fuente sale de la procedencia: "GISTEMP v4 · fuente provisional".
- **Inspector de celda**: con la API muestra la serie anual real 2000–2025 de la celda y el
  veredicto Mann-Kendall / Sen calculado por el backend (antes decía "Sin calcular").
- Cobertura "tierra" (vista inicial, a petición de Diego: "en todo el planeta se ve horrible"):
  la grilla de la API se recorta con la misma máscara MODIS de agua que usa el globo (celda
  terrestre si ≥ 50 % de su superficie es tierra). 3.153 celdas en vez de 11.153; "Incluir
  océanos" muestra todas.
- La grilla regular de 2° se aclara por fila (una de cada `round(1/cos φ)` celdas) para que las
  columnas no se apilen en los polos. No interpola: cada celda dibujada es una observación
  recibida, con su valor exacto.

## Medido

Todo en el equipo de Diego (Windows 11, .NET 10.0.401, DuckDB.NET 1.5.5), con GISTEMP de
2000-01 a 2026-08.

| Medida | Valor |
| --- | --- |
| netCDF → CSV (Python) | 5.142.681 filas en 9,4 s; CSV de 173 MB |
| CSV → Parquet (`normalize`) | 2,5–2,6 s; Parquet de 13,4 MB; pico de memoria 951 MB |
| Importación en base vacía (EtlCli / API al arrancar) | 8,1–9,6 s / 10,3–12,6 s; pico de memoria 647 MB (EtlCli) |
| Rearranque con el mismo Parquet | 0,1–0,2 s (comparación por SHA-256) |
| Tamaño de la base DuckDB | 132 MB |
| `/api/trends/grid` 2000–2025 | 1,15 s la primera vez (con arranque en frío); 0,30–0,47 s sin caché; 0,06 s con caché |
| `/api/trends/observations` | 0,06–0,13 s; 3.053.701 B → 359.777 B con Brotli |
| Celdas en la grilla 2000–2025 | 16.021 (de 16.200) |

**Comprobación independiente** (celda 29° N, 3° O): la media de 2024 calculada directamente
sobre el CSV es 2,6283 °C y la pendiente de Sen 0,0525 °C/año. La API devuelve exactamente lo
mismo, y el inspector muestra "+0,053 °C/año · p = 0,00015 · significativa".

Pendiente media de la grilla 2000–2025, ponderada por área (cos φ): 0,262 °C/década. Ártico
(≥ 66° N), con la misma ponderación: 0,0719 °C/año, 2,7 veces la media global.

## Pendiente

- **Despliegue (decidido por Diego: opción recomendada, 2026-10-05)**: el Parquet va en
  `backend/seed/` y entra en la imagen; DuckDB con tope `DuckDb__MemoryLimit=256MB` y
  `DuckDb__Threads=2` (Dockerfile). Medido en local con ese tope: importación 10,5-15,1 s,
  pico del proceso 381-387 MB (EtlCli) y **423 MB la API completa** (carga + consultas),
  197 MB en reposo. Sin tope: 647 MB. **No medido en un contenedor Linux real de 512 MB**
  (Docker Desktop no estaba arrancado y la prueba exigía descargar las imágenes de .NET).
- Con tope de memoria, DuckDB vuelca a `<base>.tmp`. En Windows, con una ruta de 267 caracteres
  (más de MAX_PATH = 260), la importación falló con "IO Error: Cannot open file"; con 184
  caracteres funcionó. La carpeta temporal se crea explícitamente (`DuckDb:TempDirectory`).
- ESLint no está instalado en el repo (`npm run lint` falla con "eslint no se reconoce"), así
  que no se pudo pasar; `tsc` y el build de Vite sí pasan.
- `useHexData` y `HexReadout` (grilla de tendencias por celda) no están montados en la interfaz;
  su fuente ya apunta a `/api/trends/grid`.
- NDVI, GRACE y OCO-2: esperan el token de EarthData.
