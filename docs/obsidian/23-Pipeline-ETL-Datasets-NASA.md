# 🛰️ Pipeline ETL de Datasets Satelitales NASA [S1-T2]

Volver al [[00-Map-Of-Content]] | [[11-Trazabilidad-ClickUp-Sprint-1]] | [[22-Almacen-Columnar-DuckDB]]

---

## 🎯 Objetivo
Descargar datasets abiertos de la NASA, normalizarlos a una grilla WGS84 canónica, limpiar valores erróneos y exportarlos como Parquet SNAPPY listos para el importador DuckDB de [S2-T2].

```
NASA EarthData / GISS ──► NasaEarthDataClient ──► data/nasa/raw (caché)
        CSV crudo ──► SpatialGridNormalizer ──► limpieza + imputación ──► data/nasa/normalized/*.parquet
                                                                              │
                                                     ParquetImporter [S2-T2] ◄┘
```

## 1️⃣ Cliente de descarga [S1-T2.1]
- `NasaEarthDataClient` (`Infrastructure/ExternalServices/`), HttpClient tipado registrado con `AddNasaEarthData`.
- **Búsqueda:** granules en CMR (`search/granules.json`) por `short_name`, versión, rango temporal, bounding box y paginación.
- **Descarga:** streaming a disco con caché en `data/nasa/raw` (escritura atómica `.partial` + rename, validación de `Content-Length`). Si el archivo ya existe no se vuelve a pedir.
- **Resiliencia:** `Microsoft.Extensions.Http.Resilience` (Polly) con reintentos exponenciales + jitter ante 408/429/5xx/timeouts y timeout por intento.
- **Token:** Bearer de Earthdata Login leído de `NASA_EARTHDATA_TOKEN` (o `NasaEarthData:Token`). Nunca se registra en logs y **solo se envía por HTTPS a dominios Earthdata** (`earthdata.nasa.gov`, `earthdatacloud.nasa.gov`, `eosdis.nasa.gov`) o a los añadidos en `NasaEarthData:AdditionalTrustedTokenHosts`. Las peticiones públicas (CMR, GISTEMP) nunca llevan el token.
- **Catálogo:** `NasaDatasetCatalog` con GISTEMP v4 (público), MODIS MOD13A2/MYD13A2 061, GRACE Tellus Land Mascon y OCO-2 XCO2.

## 2️⃣ Normalizador de grilla [S1-T2.2]
- `SpatialGridNormalizer` (`Infrastructure/Etl/`) transforma con SQL de DuckDB, sin deserializar fila por fila.
- **Entrada:** CSV con columnas configurables por variable (`GridNormalization:Mappings`). NetCDF/HDF5/GeoTIFF son un punto de extensión: basta implementar `IRawDatasetReader`.
- **Normalización:** longitudes 0–360 → [-180, 180), latitudes validadas en [-90, 90], coordenadas redondeadas a 2 decimales para que coincidan entre misiones; se descartan coordenadas o fechas inválidas.
- **Salida:** tuplas canónicas `(variable_id, latitude, longitude, timestamp, value, anomaly)` con `COPY ... (FORMAT PARQUET, COMPRESSION SNAPPY)` en `data/nasa/normalized`.

## 3️⃣ Limpieza e imputación [S1-T2.3]
- Fill values (`-9999`, `9999`, NaN, infinitos y los configurados por variable) y valores fuera de rango físico → `NULL` analítico. Rangos por defecto en `GridNormalization:Cleaning:Rules` (p. ej. NDVI [-1, 1], XCO2 [300, 500] ppm).
- Lecturas duplicadas en la misma celda y timestamp (p. ej. varios sondeos OCO-2) se **promedian** antes de interpolar.
- **Interpolación temporal lineal solo para huecos de un periodo:** el periodo de cada celda es su menor paso entre fechas; se imputa si las vecinas válidas distan como máximo 2.5 periodos. Así, los periodos ausentes del archivo también cuentan como hueco (enero, febrero NULL y diciembre no se interpola).
- **Métricas de calidad** (`DataQualityMetrics`): porcentaje de valores válidos antes y después de imputar, por variable, devueltas en el resultado y registradas con `ILogger`.

## ⚙️ Variables de entorno

| Variable | Uso |
| :--- | :--- |
| `NASA_EARTHDATA_TOKEN` | Token Bearer de Earthdata Login (requerido para MODIS, GRACE y OCO-2). |
| `DUCKDB_DATABASE_PATH` | Ruta de la base DuckDB (ver [[22-Almacen-Columnar-DuckDB]]). |

## 🧪 Pruebas
Sin descargas reales: `HttpMessageHandler` simulado para el cliente y CSV diminutos generados en cada test para el normalizador y la limpieza.

```bash
dotnet test backend/NasaTrendDetective.slnx
```
