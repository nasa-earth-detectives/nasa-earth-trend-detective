# 37 · MERRA-2, GPM y MODIS: seis variables reales nuevas, casos opuestos, estadística y rediseño

Hecho el 2026-11-14, primer día del hackathon NASA Space Apps (Neiva). Rama `feat/merra2-real-data`.

## Por qué

El reto "Be An Earth System Trend Detective!" pide elegir variables de misiones o modelos de la
NASA, mirar una región, dibujar la serie y decir si la tendencia es significativa. Nombra, entre
otros, el modelo **MERRA-2**. Hasta hoy sólo GISTEMP tenía datos reales; NDVI, GRACE y CO₂ eran
escenarios de demostración, y los "casos" llevaban cifras escritas a mano.

## Qué hay ahora

| Variable (`ClimateVariable`) | id | Parámetro POWER | Unidad | Celdas de 2° | Filas |
| --- | --- | --- | --- | --- | --- |
| `Merra2Temperature` | 5 | `T2M` | °C | 16.200 | 729.000 |
| `Merra2Precipitation` | 6 | `PRECTOTCORR` | mm/día | 16.200 | 729.000 |
| `Merra2Evaporation` | 7 | `EVLAND` | mm/día | 4.573 (sólo tierra) | 205.785 |
| `Merra2SoilMoisture` | 8 | `GWETROOT` | fracción 0–1 | 4.573 (sólo tierra) | 205.785 |
| `GpmPrecipitation` | 9 | `IMERG_PRECTOT` | mm/día | 16.200 | 453.600 |

Cobertura: MERRA-2 **1981–2025** (45 años) y GPM IMERG **1998–2025** (28 años), una fila por celda y
año. Con GISTEMP y el NDVI de MODIS (más abajo) son **7 variables reales de 9**; GRACE y CO₂ siguen
siendo demostración.

## De dónde salen los datos

NASA POWER v10 (NASA Langley) publica MERRA-2 en un bucket abierto de AWS, **sin cuenta ni token**:
`https://nasa-power.s3.amazonaws.com/merra2/temporal/power_merra2_annual_temporal_utc.zarr`.
Licencia CC BY 4.0. Cada variable es un array (49 años reservados, 361 latitudes, 576 longitudes) en
bloques de 49 × 30 × 30 comprimidos con Blosc/zstd y un filtro de escala fija.

Comprobaciones hechas (medidas, no supuestas):

- La lectura del Zarr coincide con la API pública de POWER para el punto (3° S, 60° O) en los 45 años,
  con diferencia máxima de 0,01 (redondeo), en temperatura y en precipitación.
- La media mundial ponderada por área es la misma antes y después de regrillar: temperatura
  14,297 °C en 1981 y 14,963 °C en 2025; precipitación 2,692 y 2,542 mm/día.
- Ningún bloque ausente en las cuatro variables. Descarga: 26 MB de bloques comprimidos.

## Cómo se procesa

`scripts/etl/nasa_power_zarr_to_csv.py` (lee con `power_zarr.py` y regrilla con `power_grid.py`):

1. Usa la media **anual** que ya calcula POWER; no promedia meses.
2. Regrilla de 0,5° × 0,625° a la **misma grilla de 2° de GISTEMP** con promedio ponderado por el área
   de solape. Una celda de 2° con menos de la mitad de su área con dato queda sin fila.
3. `anomaly` = valor menos la media de la celda en 1991–2020. La pendiente es la misma con valor o
   con anomalía; la anomalía hace legible el mapa de un año.
4. Escribe el CSV y el manifiesto `backend/seed/merra2_*.provenance.json`. Después,
   `EtlCli normalize` genera los Parquet (4,7 + 2,9 + 0,7 + 0,8 MB).

Requisitos: `pip install numpy numcodecs`. La conversión tardó 26 s con tres de las cuatro variables ya descargadas.

## Cambios en el backend

- **Cadencia por variable** (`VariableCadence`): las consultas exigían 9 meses por año. Con una fila
  por año, las series de MERRA-2 quedaban vacías. Ahora son 9 periodos para datos mensuales y 1 para
  anuales; la regla de GISTEMP no cambia.
- **Migración del esquema**: `dim_variable` tenía `CHECK (variable_id BETWEEN 1 AND 4)` y
  `CREATE TABLE IF NOT EXISTS` no lo quita. El inicializador detecta el CHECK antiguo, suelta las tres
  tablas atadas por la clave foránea y el sembrado las recarga desde los Parquet.
- Las variables MERRA-2 **no tienen escenario sintético**: sin dataset devuelven serie vacía.
- `VariableUnits` ya no cae en "ppm" por defecto: una variable sin unidad declarada lanza excepción.
- Al cerrar esta parte: 166 de 166 tests. El total final está en la sección Tests.

Resultado de `/api/trends/grid` en 1981–2025 (Mann-Kendall, 95 %):

| Variable | Celdas | Suben | Bajan | No significativas |
| --- | --- | --- | --- | --- |
| Temperatura del aire | 16.200 | 10.986 | 1.057 | 4.157 |
| Precipitación | 16.200 | 2.948 | 2.674 | 10.578 |
| Evaporación en tierra | 4.573 | 1.136 | 628 | 2.809 |
| Humedad del suelo | 4.573 | 1.237 | 645 | 2.691 |

## Casos de estudio: dos regiones, sentidos opuestos

El panel "Casos" ya no tiene cifras escritas. Compara dos celdas (`config/opposingCases.ts`) y pide a
la API el veredicto de cada variable al abrirse. Valores medidos el 2026-11-14 (por década):

| Variable | Centro-oeste de Brasil (19° S, 53° O) | Bangladés (23° N, 91° E) |
| --- | --- | --- |
| Temperatura del aire | +0,585 °C, p < 0,001 | −0,112 °C, p = 0,0058 |
| Precipitación | −0,528 mm/día, p < 0,001 | +1,53 mm/día, p < 0,001 |
| Humedad del suelo | −0,0467, p < 0,001 | +0,0604, p < 0,001 |
| Evaporación en tierra | −0,395 mm/día, p < 0,001 | +0,311 mm/día, p < 0,001 |

Las cuatro son significativas y de signo contrario.

**Límite que hay que decir en el pitch:** MERRA-2 es un reanálisis (un modelo que asimila
observaciones). Sus tendencias de precipitación pueden incluir efectos de cambios en el sistema de
observación. La herramienta muestra qué dicen los datos, no la causa.

## Cambios en el frontend

- Las cuatro variables en tipos, capas, glosario, escalas de color (dominios = percentil 99 medido),
  validadores de la API y asistente.
- El **paso "región" del asistente no hacía nada**: se elegía y se descartaba. Ahora el globo vuela al
  lugar y abre su análisis.
- La línea de tiempo toma el rango de cada fuente (MERRA-2: 1981–2025). Antes, con el año en curso,
  el globo quedaba vacío al elegir una variable de MERRA-2.
- El periodo de tendencia se recorta a la cobertura real de la fuente.
- `detectiveAnalysis.ts` estaba en UTF-8 codificado dos veces ("mÃ¡s aÃ±os" en pantalla): reparado.
- `DetectiveWizard.tsx` (247 líneas) e `ImmersiveEarthLayout.tsx` (210) superaban el límite de 200 de
  la CI: partidos.

### Rediseño (asistente, casos y glosario)

- Asistente acoplado a la izquierda, con el globo a la vista y reaccionando a cada elección.
- Sin emojis: iconos de `lucide-react` con el acento mineral de cada variable.
- Variables en lista, separadas en "Datos reales de la NASA" y "Sólo demostración".
- Paso de periodo con una regla de años: qué cubre la fuente y qué tramo se analiza.
- Casos y glosario sin colores por tarjeta; el color sólo indica el sentido del cambio.
- Foco atrapado en los diálogos y respeto de `prefers-reduced-motion`.

## GPM IMERG: la lluvia medida desde satélite

GPM es una de las misiones que nombra el reto. Su producto IMERG está en el mismo bucket
(`imerg/temporal/power_imerg_annual_temporal_utc.zarr`, 0,1°, 1.296 bloques, 124 MB descargados).
Periodo base 2001-2020, porque empieza en 1998. POWER marca el parámetro como "reviewing".

- Media mundial ponderada: 2,7797 mm/día nativa y 2,7797 a 2° (1998); 2,7937 y 2,7937 (2025).
- Grilla 1998-2025: 3.693 celdas suben, 943 bajan y 11.564 no son significativas.
- Sirve para **comparar modelo y satélite en el mismo lugar**. En la celda 5° S, 61° O, MERRA-2
  (1981-2025) da un descenso significativo (p = 0,016) y GPM (1998-2025) no ve tendencia (p = 0,83):
  otra fuente y menos años. Es el caso que el reto describe ("a veces sólo le faltan años").

## NDVI de MODIS: por GIBS, no por AppEEARS

**Lo que no sirvió.** AppEEARS sólo sirve MODIS en teselas de 1 km. Se pidieron por puntos las 4.573
celdas de tierra, mes a mes de 2000 a 2025 (5 tareas). Medido: la primera tarea tardó 23 minutos en
avanzar un 1 % de su paso de descarga, y las tareas se procesan de una en una. Del orden de 38 horas
por tarea: se cancelaron. AppEEARS tampoco tiene GRACE ni OCO-2.

**Lo que sí.** NASA GIBS, el servicio abierto de imágenes, publica el mismo producto (capa
`MODIS_Terra_L3_NDVI_Monthly`, de 2000-03 en adelante) como teselas PNG, sin cuenta. La imagen usa
una paleta oficial de 142 clases que asigna a cada color un intervalo de NDVI de 0,005 a 0,01 de
ancho, así que el valor se recupera hasta ese ancho (`scripts/etl/gibs_ndvi_to_csv.py`).

- Nivel 2 de la pirámide: 15 teselas por mes a 0,14° por píxel, unos 200 píxeles por celda de 2°.
- Descarga completa: 309 meses (GIBS no publica 2025-04), 4.635 teselas, 184 MB, en 5 min 4 s.
- 1.010.695 filas; 3.684 celdas de tierra, 3.094 con al menos 10 años de 9 meses o más.
- Es **mensual**, como GISTEMP: se le aplica la regla de 9 meses por año. Las celdas con nieve en
  invierno pierden meses y algunas quedan sin serie: no se rellenan.
- Comprobación de sentido, julio de 2015: Amazonía central 0,81; Congo 0,83; Europa central 0,67;
  interior de Australia 0,20; Sahara 0,09; Groenlandia y océano, sin fila.

Grilla 2000-2025 (Mann-Kendall, 95 %): 1.146 celdas suben, 141 bajan y 1.807 no son significativas.
Por década: norte de India +0,046 (p = 2 × 10⁻⁸), Sahel +0,008 (p = 0,002), Amazonía central +0,0004
(p = 0,86, sin tendencia).

Límite: los píxeles con NDVI menor o igual que 0 se publican transparentes en GIBS y no entran en la
media de la celda.

## Estadística: los tres métodos que nombra el reto

- **Mann-Kendall + pendiente de Sen** (ya estaba).
- **Intervalo de confianza del 95 % de Sen**, corregido: el límite inferior usaba el rango M1 como
  índice desde 0 y quedaba una posición alto. Ahora sigue a Sen (1968), como `scipy.stats.theilslopes`.
- **Prueba t de la regresión lineal** (`LinearTrendTest`, `StudentTDistribution`): pendiente por
  mínimos cuadrados, error estándar, t, valor p bilateral e intervalo del 95 %.

La API los devuelve juntos (`confidenceInterval95` y `linear`) y la tarjeta los muestra con una línea
que dice si los dos métodos coinciden.

**Validación cruzada con SciPy 1.18.1** (`SciPyCrossValidationTests`), sobre tres series, una de ellas
real (precipitación MERRA-2 en 5° S, 61° O): pendiente de Sen e intervalo, pendiente lineal, error,
t e intervalo coinciden a 6 decimales, y el valor p con error relativo menor que 1e-6. Para la serie
real: Sen -0,025477 con intervalo [-0,043182; -0,004688]; regresión -0,019973, t = -2,1230, p = 0,03955.

Se retiró `NasaCrossValidationTests`: generaba una recta de pendiente 0,07 y comprobaba que salía
0,07, llamándolo validación contra la NASA.

## Arcos del globo: pares reales

`OpposingTrendsService` ya no fabrica rectas. Lee de DuckDB la serie de cada celda y devuelve el par
sólo si hay dataset, al menos 10 años y pendientes de signo contrario. Pares vigentes
(`OpposingPairCatalog`), medidos el 2026-11-14, por década:

| Variable | Sube | Baja |
| --- | --- | --- |
| Temperatura del aire | Centro-oeste de Brasil, +0,585 °C | Norte de Bangladés, -0,264 °C |
| Precipitación | Bangladés oriental, +1,532 mm/día | Occidente de Venezuela, -0,874 mm/día |
| Humedad del suelo | Extremo oriente de Rusia, +0,025 | Ontario y Quebec, -0,043 |
| Evaporación en tierra | Gansu (China), +0,117 mm/día | Sureste de Brasil, -0,254 mm/día |

Los ocho veredictos son significativos con los dos métodos. Sin API, el frontend ya no dibuja una
copia local de pares: sólo los dos procesos físicos de contexto, marcados como ilustrativos.

## Memoria del servidor

Carga completa desde cero con los límites del contenedor (`DuckDb__MemoryLimit=256MB`, 2 hilos),
medida con `EtlCli seed` en Windows: **pico de 652 MB**, base de 186 MB, 15,5 s. El pico lo marca
GISTEMP (9,6 s); los cinco datasets nuevos suman 5,9 s y no lo suben. No se ha probado en Render.

## Tests

180 de 180 (`dotnet build -warnaserror`, 0 avisos).

## Pendiente

- Textos de la interfaz en inglés: lo hacen otros compañeros (ver la sección 7 de la nota 38).
- ~~GRACE y OCO-2 siguen como demostración.~~ **Hecho el mismo 2026-11-14, sin token:** GRACE desde los
  mascons de NASA Goddard y CO₂ desde el WMS de NASA GIBS. Ver [[40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia]].

Hecho después de escribir esta lista: el dossier (nota 35) se reescribió con cifras medidas, sin
declarar como reales las variables de demostración, con Gemini y Claude en la declaración de IA y
con el enlace correcto al repositorio.
- Desplegar y comprobar la memoria en Render.
