# 🦆 Almacén Columnar DuckDB Embebido [S2-T2]

Volver al [[00-Map-Of-Content]] | [[15-Trazabilidad-ClickUp-Sprint-2]] | [[01-Arquitectura-Monorrepo]]

---

## 🎯 Objetivo
Motor analítico OLAP embebido en el backend .NET 10 para almacenar y agregar millones de observaciones satelitales con respuestas menores a 50 ms, sin servidor de base de datos externo.

## 🧱 Piezas (capa `NasaTrendDetective.Infrastructure`)

| Pieza | Ubicación | Responsabilidad |
| :--- | :--- | :--- |
| `DuckDbOptions` | `Implements/` | Ruta de la base (`DuckDb:DatabasePath`), `DUCKDB_DATABASE_PATH` tiene prioridad; vacío o `:memory:` = modo memoria. |
| `DuckDbConnectionFactory` | `Implements/` | Una conexión aislada por operación (`await using`). En `:memory:` mantiene una conexión ancla y entrega duplicados para que todas vean la misma base. |
| `IDuckDbRepository` / `DuckDbRepository` | `Interfaces/`, `Implements/` | Métodos asíncronos con `CancellationToken`: health check, versión, escalares, consultas mapeadas y comandos con parámetros `$nombre`. |
| `init_schema.sql` | `Scripts/` (recurso embebido) | Esquema estrella idempotente + seed de `dim_variable`. |
| `DuckDbSchemaInitializer` + `DuckDbSchemaHostedService` | `Implements/` | Ejecuta el script al arrancar la API. |
| `ParquetImporter` | `Etl/` | Carga masiva `read_parquet(glob)` → `fact_climate_observations` en una transacción. |
| `CellAggregationSql` | `Queries/` | Agregación por celda espacial (lat/lng redondeados, promedio por variable y año) para la capa de hexágonos 3D. |

Registro por DI: `builder.Services.AddInfrastructure(builder.Configuration)` en `Program.cs` (`AddDuckDb` + `AddParquetImport`).

## ⭐ Esquema Estrella

```
dim_variable ──┐
dim_time ──────┼── fact_climate_observations
dim_location ──┘
```

- **`fact_climate_observations`**: `observation_id BIGINT PK`, `variable_id TINYINT` (1=Gistemp, 2=ModisNdvi, 3=GraceMass, 4=Oco2, alineado con `ClimateVariable`), `latitude/longitude DECIMAL(6,3)`, `year SMALLINT`, `month TINYINT`, `observation_value DOUBLE`, `anomaly_value DOUBLE`.
- **Orden de inserción obligatorio:** `ORDER BY variable_id, year, latitude, longitude`. DuckDB guarda min/max por row group; con este orden los filtros por variable, años o caja geográfica descartan bloques completos (*data skipping*). No se crean índices ART: el orden físico es el índice.

## 📥 Importación de Parquet
- Glob configurable en `ParquetImport:SourceGlob` (por defecto `data/nasa/normalized/*.parquet`, la salida del normalizador ETL de [S1-T2]).
- Antes de insertar valida con `DESCRIBE` que el Parquet tenga el esquema canónico `(variable_id, latitude, longitude, timestamp, value, anomaly)`; si no, lanza `ParquetImportException`.
- Deriva `year`/`month` del `timestamp`, convierte NaN en NULL, conserva los NULL de la limpieza y es idempotente al reimportar (anti-join sobre la clave natural).
- Rutas y globs se escapan con `DuckDbSqlText` (sin SQL injection).

## ⏱️ Rendimiento
`CellAggregationPerformanceTests` genera ~200k filas sintéticas y verifica que la agregación global por celda responde en < 50 ms tras un warm-up. El test lleva `Trait("Category", "Performance")` para poder excluirlo en CI lentos con `--filter "Category!=Performance"`.

## 🐳 Contenedor
La imagen runtime del backend pasó de `aspnet:10.0-alpine` a `aspnet:10.0` (Debian): la librería nativa de DuckDB no funciona con musl. Se mantiene el usuario no root `app`, `/app/data` es escribible y el Dockerfile instala `wget` para el healthcheck de `docker-compose`.

## 🧪 Pruebas
Proyecto `backend/tests/NasaTrendDetective.Tests` (xUnit, net10.0) incluido en `NasaTrendDetective.slnx`: fábrica, repositorio, concurrencia, esquema, importador y agregaciones, todo contra DuckDB en memoria.

```bash
dotnet test backend/NasaTrendDetective.slnx
```
