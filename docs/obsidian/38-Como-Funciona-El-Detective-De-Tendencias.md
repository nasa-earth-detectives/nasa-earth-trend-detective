# 38 · Cómo funciona el Detective de Tendencias, de punta a punta

Guía para el equipo. Explica qué hace la herramienta, de dónde salen los datos, cómo viajan hasta la
pantalla y dónde está cada cosa en el código. Escrita el 2026-11-14 sobre la rama
`feat/merra2-real-data`. El registro de lo que se cambió y sus cifras está en
[[37-MERRA2-Datos-Reales-y-Casos-Opuestos]]. Actualizada esa misma tarde con GRACE y CO₂ reales y las dos
correcciones del veredicto: [[40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia]].

## 1. Qué hace, visto desde el usuario

El reto pide responder cuatro preguntas. La herramienta las responde en este orden:

1. **Qué**: el asistente ofrece las variables. Las nueve tienen datos reales de la NASA. Si a la API le
   faltara alguna semilla, esa variable aparecería aparte y rotulada como demostración.
2. **Dónde**: una región sugerida o cualquier punto del globo. El globo gira al lugar mientras se elige.
3. **Cuántos años**: una regla de años muestra qué cubre la fuente y qué tramo se va a analizar.
4. **Cuánto y si es significativo**: la tarjeta dibuja la serie anual y da el veredicto con tres
   métodos, y dice si se sostiene al descontar la persistencia entre años.

Además:

- **Lectura "Tendencia (Sen)"** en el panel de variables: el globo pinta el ritmo de cambio de cada
  celda en todo el periodo. Ahí se ve dónde sube y dónde baja, y cuántas celdas siguen siendo
  significativas después de corregir.
- **Casos**: tablero que compara dos regiones, variable por variable, con cifras calculadas al abrirlo.
- **Glosario**: seis conceptos en lenguaje llano.

## 2. Los datos

| Variable | Fuente | Periodo | Estado |
| --- | --- | --- | --- |
| Temperatura superficial | GISTEMP v4 (NASA GISS) | 2000-01 a 2026-08, mensual | real |
| Temperatura del aire a 2 m | MERRA-2 vía NASA POWER | 1981–2025, anual | real |
| Precipitación (modelo) | MERRA-2 vía NASA POWER | 1981–2025, anual | real |
| Precipitación (satélite) | GPM IMERG vía NASA POWER | 1998–2025, anual | real |
| Evaporación en tierra | MERRA-2 vía NASA POWER | 1981–2025, anual | real |
| Humedad del suelo | MERRA-2 vía NASA POWER | 1981–2025, anual | real |
| Vegetación (NDVI) | MODIS Terra vía NASA GIBS | 2000-03 a 2025-12, mensual | real |
| Masa de agua y hielo | GRACE y GRACE-FO, mascons de NASA GSFC | 2002-04 a 2025-12, mensual | real |
| Dióxido de carbono | OCO-2 vía NASA GIBS | 2015–2025, anual | real |

Todas comparten **la misma grilla de 2°** (centros en latitudes y longitudes impares). Por eso el
globo, la API y las consultas no distinguen de qué fuente viene una celda.

### Cómo entra un dato en la aplicación

```
fuente NASA ──(script Python)──> CSV ──(EtlCli normalize)──> Parquet + manifiesto
                                                                    │
                                              backend/seed/ ────────┘
                                                    │  al arrancar la API
                                                    ▼
                                                 DuckDB
```

1. **Conversor** (`scripts/etl/`): baja la fuente y escribe un CSV con cinco columnas
   (`lat, lon, time, value, anomaly`) y un manifiesto `*.provenance.json` (de dónde sale, SHA-256,
   periodo base, cita).
   - `nasa_power_zarr_to_csv.py`: MERRA-2 y GPM IMERG, desde el bucket abierto de NASA POWER. No pide
     cuenta. Usa `power_zarr.py` (lectura) y `power_grid.py` (regrillado).
   - `gistemp_netcdf_to_csv.py`: GISTEMP.
   - `gibs_ndvi_to_csv.py`: NDVI de MODIS, desde las teselas abiertas de NASA GIBS. No pide cuenta.
2. **Normalizador** (`backend/tools/NasaTrendDetective.EtlCli`): valida y escribe el Parquet en
   `backend/seed/`.
3. **Sembrado**: al arrancar, la API carga cada par Parquet + manifiesto en DuckDB. Si el SHA-256 del
   Parquet no cambió, no reimporta.

Los comandos exactos están en `backend/seed/README.md`.

### Qué se hace con cada dato y por qué

- **Regrillado**: promedio ponderado por el área de solape. Una celda con menos de la mitad de su
  área con dato queda sin fila; no se rellena.
- **Anomalía**: valor menos la media de esa celda en el periodo base (1991–2020 en MERRA-2,
  2001–2020 en GPM, 1951–1980 en GISTEMP). La tendencia es la misma con valor o con anomalía; la
  anomalía hace legible el mapa de un año.
- **Años incompletos**: en datos mensuales un año cuenta si tiene al menos 9 meses. En datos anuales
  cada año es una fila (`VariableCadence`).

## 3. El backend (.NET 10 + DuckDB)

| Ruta | Qué devuelve |
| --- | --- |
| `GET /api/datasets` | Las 9 variables, con `observed` o `synthetic` y su procedencia |
| `GET /api/trends?variable&startYear&endYear&latitude&longitude` | Serie anual de una celda y su veredicto |
| `GET /api/trends/grid?variable&startYear&endYear` | Veredicto de todas las celdas (el mapa de tendencias) |
| `GET /api/trends/observations?variable&year` | Valores de un año en toda la grilla |
| `GET /api/trends/opposing` | Pares de regiones con tendencias opuestas, calculados al momento |
| `POST /api/trends/analyze` | Veredicto de una serie enviada por el cliente |

### El veredicto estadístico

`TrendStatisticsEngine.Analyze` calcula sobre la serie anual:

- **Mann-Kendall** (`MannKendallCalculator`): compara cada año con todos los demás. Da Z y el valor p.
  No supone que los datos sigan una distribución concreta.
- **Pendiente de Sen** (`SensSlopeEstimator`): la mediana de las pendientes entre todos los pares de
  años, con su intervalo de confianza del 95 %. Un año extremo no la arrastra.
- **Prueba t** (`LinearTrendTest`, `StudentTDistribution`): regresión lineal por mínimos cuadrados, con
  error estándar, t, valor p e intervalo del 95 %.

- **Mann-Kendall con preblanqueo** (`PrewhiteningTrendTest`): el mismo test después de restar a cada
  año lo que hereda del anterior. Si a un año seco le suele seguir otro seco, el test clásico toma esa
  racha por tendencia; éste dice si la tendencia sigue ahí cuando se descuenta.

Significativo quiere decir p < 0,05. Los tres primeros se contrastan con SciPy en
`SciPyCrossValidationTests`; el cuarto y el ajuste del mapa, en `SignificanceCorrectionsTests`.

En el mapa (`GridTrendService`) hay un paso más. Con miles de celdas probadas a la vez, p < 0,05 deja
pasar cientos por azar: `BenjaminiHochberg` ajusta los valores p del preblanqueo y marca como sostenidas
(`isSignificantCorrected`) las celdas que superan una tasa de falsos hallazgos del 5 %. Por qué estos
métodos y no otros, con la simulación que lo decide, en la nota 40.

### Reglas de honestidad que el código hace cumplir

- Una variable sin dataset se declara `synthetic`; `/api/trends/grid` responde 404 en vez de inventar.
- Las variables de MERRA-2 y GPM no tienen escenario sintético: sin datos, devuelven vacío.
- `OpposingTrendsService` sólo devuelve un par si hay datos, al menos 10 años y pendientes de signo
  contrario.

## 4. El frontend (React 19 + Globe.gl)

| Pieza | Archivos |
| --- | --- |
| Asistente de inicio | `components/Detective/DetectiveWizard*.tsx`, `config/wizardOptions.ts` |
| Tarjeta de resultado | `components/Detective/DetectiveCard.tsx`, `TrendMethods.tsx`, `TimeSeriesChart.tsx` |
| Casos | `components/Detective/DetectiveMissionsModal.tsx`, `OpposingCaseCell.tsx`, `config/opposingCases.ts` |
| Glosario | `components/Detective/DetectiveGlossaryModal.tsx`, `config/glossary.ts` |
| Catálogo de variables | `config/climateLayers.ts` (lista única), `config/scienceTheme.ts` (color) |
| Escalas de color | `utils/colorScales.ts` (valor de un año), `services/demo/hexDemoData.ts` (pendiente) |
| Frontera con la API | `services/datasetCatalog.ts`, `observationDataSource.ts`, `hexDataSource.ts`, `hooks/useCellTrend.ts` |
| Globo y capas 3D | `components/Globe/` |

Decisiones que conviene conocer:

- **El catálogo manda.** El frontend pregunta a `/api/datasets` qué variables son reales. Las que no
  lo son usan un escenario de demostración rotulado; las de MERRA-2 y GPM, nada.
- **Los validadores son estrictos.** Si la API devuelve una unidad o un código que no esperan, lo
  rechazan en vez de pintarlo. Al añadir una variable hay que tocarlos (ver sección 6).
- **La línea de tiempo sigue a la fuente.** Su rango sale de la cobertura del dataset activo.
- **Un solo color saturado.** El acento de toda la interfaz es el de la variable elegida.

## 5. Arrancar y probar en local

```bash
npm install
dotnet restore backend/NasaTrendDetective.slnx
npm run dev
```

Frontend en `http://localhost:3000`, API en `http://localhost:5000`.

```bash
dotnet build backend/NasaTrendDetective.slnx -warnaserror
dotnet test backend/NasaTrendDetective.slnx
npm run type-check --workspace=frontend
npm run build --workspace=frontend
```

La CI rechaza cualquier `.ts`, `.tsx` o `.cs` de `frontend/src`, `packages/shared/src` o
`backend/src` con más de 200 líneas.

## 6. Añadir una variable nueva

1. **Datos**: un conversor que escriba el CSV y el manifiesto; después `EtlCli normalize`.
2. **Backend**: `ClimateVariable` (id nuevo), `VariableUnits`, `VariableCadence` si es anual, la regla
   de rango en `appsettings.json` y la fila de `init_schema.sql`.
3. **Frontend**: el tipo en `types/climate.types.ts`. TypeScript señala el resto: capas, glosario,
   presentación, lentes, color, escalas, iconos y los dos mapas de ids.
4. **Unidades**: la cadena de `VariableUnits` tiene que coincidir con el patrón de
   `observationDataSource.ts`.
5. **Tests**: actualizar los que cuentan variables y añadir el caso a `AnnualCadenceTests`.

## 7. Para quien traduzca la interfaz al inglés

Los textos visibles están en:

- `frontend/src/config/`: `climateLayers.ts`, `glossary.ts`, `wizardOptions.ts`, `hexPresentation.ts`,
  `observationLenses.ts`, `climateMilestones.ts`, `opposingCases.ts`.
- `frontend/src/components/`: `Detective/`, `Mission/`, `Layers/`, `Controls/`, `Rail/`, `Inspector/`.
- `frontend/src/utils/`: `detectiveAnalysis.ts`, `regionalContext.ts`, `colorScales.ts` (etiquetas).
- `frontend/src/services/`: `guidedTourService.ts`, `datasetCatalog.ts`, `teleconnectionService.ts`.
- Backend: nombres y títulos de `OpposingPairCatalog.cs` y los campos `product` y `trendUnit` de los
  manifiestos de `backend/seed/`.

Dos trampas:

- `trendUnit` termina en "/ año" y `hexPresentation.ts` lo reconoce con una expresión regular
  (`año|década|mes|día`). Si se traduce la unidad, hay que traducir también ese patrón.
- Las cadenas de unidad que valida `observationDataSource.ts` (`°C`, `mm/day`, `fraction`, `NDVI`) son
  parte del contrato con la API, no texto de interfaz: no se traducen.

## 8. NDVI de MODIS desde GIBS

El NDVI de MODIS sólo se distribuye en teselas de 1 km que piden cuenta. NASA GIBS publica el mismo
producto mensual como imagen, sin cuenta, y cada color de su paleta oficial corresponde a un
intervalo de NDVI. `gibs_ndvi_to_csv.py`:

1. Baja el nivel 2 de la pirámide: 15 teselas PNG por mes, 0,14° por píxel.
2. Convierte cada color en el punto medio de su intervalo (142 clases, de 0,005 a 0,01 de ancho).
3. Promedia por área a la grilla de 2°. Los píxeles transparentes (agua, sin dato, NDVI ≤ 0) no entran.
4. Escribe el CSV mensual y el manifiesto.

```bash
pip install numpy pillow
python scripts/etl/gibs_ndvi_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/modis_ndvi.csv --variable ModisNdvi --output modis_ndvi.parquet
```

Tarda unos 5 minutos y deja 184 MB de teselas en `data/nasa/raw/gibs_ndvi/` (fuera de git).

**Por qué no AppEEARS:** se probó. Pedir por puntos todo el planeta mes a mes tarda del orden de 38
horas por tarea (medido: 1 % en 23 minutos). Tampoco ofrece GRACE ni OCO-2: esos dos salieron de los
mascons de NASA Goddard y del WMS de NASA GIBS (nota 40).

## 9. Límites que hay que decir en voz alta

- MERRA-2 es un reanálisis: un modelo que asimila observaciones. No es una medición directa.
- NASA POWER marca su parámetro de IMERG como "reviewing".
- La herramienta dice qué muestran los datos y con qué confianza. No dice por qué ocurre.
- Sólo se analizan tendencias lineales, que es el alcance que fija el reto.
- La corrección por persistencia reduce los falsos positivos a la mitad, no los elimina (medido: de 4–38 %
  a 3,5–19 % en series simuladas sin tendencia).
- El CO₂ sube en todas las celdas casi al mismo ritmo: en esa variable no hay tendencias opuestas. Y no
  tiene serie donde las nubes dejan pocos sondeos (la Amazonía central, Colombia).
- La lluvia de MERRA-2 en la Amazonía (5° S, 61° O) era el ejemplo de "descenso significativo": no supera
  la corrección por persistencia (p = 0,091). Como ejemplo sólido, usar Brasil frente a Bangladés.
