# 42 · Auditoría del domingo: APIs conectadas, cero datos simulados y rendimiento

Registro del 2026-11-15 (segundo día del hackathon), rama `fix/audit-real-data-and-grid-performance`.
Encargo de Brayan: revisar que todas las APIs estén conectadas, que no haya datos simulados o
inventados, optimizar el rendimiento y dejar evidencia de **qué se hizo y qué no**.

Cada cifra de esta nota está medida y dice dónde. Lo que no se pudo medir figura en la sección 7.

---

## 1. Resumen

| Tema | Lo que se encontró | Lo que se hizo |
| :--- | :--- | :--- |
| Datos simulados en el backend | Sin dataset cargado, la API **fabricaba** series y mapas para cuatro variables, y eso pasaba en cada arranque mientras sembraba los datos | Generador eliminado. Sin dataset no hay números: estado `loading` o `unavailable` |
| Ventana sin datos al arrancar | En un contenedor de 512 MB la API respondía a los 2,9 s con las 9 variables sin cargar y **moría por memoria a los 77 s** | La base de datos viaja ya cargada dentro de la imagen: 9 variables reales desde la primera respuesta |
| Datos simulados en el frontend | Si la API tardaba más de 6 s (servidor dormido), la web pintaba un **escenario de demostración** | Escenario eliminado (5 archivos, 530 líneas). La web avisa de que está conectando y espera |
| Rótulos engañosos | Capas ilustrativas rotuladas como productos de la NASA «operativos»; «Nivel del mar» como activo; el proyecto como «misión de la NASA» | Rotulado lo que es calculado, ilustrativo o previsto |
| Rendimiento del mapa de tendencias | En vivo, la primera petición tardaba de 20 a 36 s por variable | Precalentado al arrancar y caché sin caducidad: **0,003 a 0,05 s**; el cálculo en sí, 3,7 veces más rápido |
| Dos mapas a la vez | Error 500: DuckDB se quedaba sin memoria | Se calculan de uno en uno |
| El servidor se quedaba sin memoria | Cada mapa de un periodo no precalculado dejaba el proceso más alto; al décimo, el contenedor de 512 MB **moría**. Y si DuckDB agotaba su límite en una consulta, **todas las siguientes fallaban** hasta reiniciar | Tabla anual ya calculada, mapas por defecto dentro de la imagen y el asignador de DuckDB devolviendo memoria: 16 mapas seguidos, **225–270 MiB estables y ningún error** |
| El globo 3D en equipos sin tarjeta gráfica | Dibujando por software a 1366×768, la web iba a **5,2 cuadros por segundo**, también parada, y pasaba 22,4 s bloqueada antes de que nadie la tocara | **Mismo diseño**, dibujado sólo cuando algo cambia: página libre en reposo, **19–20 cuadros/s** al girar, 7,6–8,3 s; satélites de 156.000 a 40.000 triángulos |
| APIs conectadas | 5 de los 8 puntos de la API los usa la web; los otros 3 no | Inventariado (sección 2). No se borró ninguno |

Comprobado: 243 tests del backend (213 antes), `dotnet build -warnaserror` sin avisos, `type-check` y
`build` del frontend sin errores, React Doctor sin avisos en los 39 archivos cambiados, y la web vista
en el navegador contra el contenedor final (API apagada, API encendida, mapa de tendencias y cambio de
perfil de calidad en caliente).

---

## 2. APIs: qué está conectado

**Estado en vivo antes de tocar nada** (2026-11-15, 07:00 hora local, medido con `curl`):
`/api/datasets` devuelve las 9 variables como `observed`; los tres frontends de Vercel responden 200 y
el proxy `/api` de producción llega al backend de Render.

| Punto de la API | ¿Lo usa la web? | Dónde |
| :--- | :--- | :--- |
| `GET /api/datasets` | Sí | `services/datasetCatalog.ts` |
| `GET /api/trends` (una celda) | Sí | `services/trendService.ts` → tarjeta y tablero de casos |
| `GET /api/trends/grid` | Sí | `services/hexDataSource.ts` → lectura «Tendencia» |
| `GET /api/trends/observations` | Sí | `services/observationDataSource.ts` → valor del año |
| `GET /api/trends/opposing` | Sí | `services/teleconnectionService.ts` → arcos del globo |
| `GET /api/trends/opposing/{id}` | No | — |
| `POST /api/trends/analyze` (serie propia) | No | — |
| `GET /api/opposing-trends` y `/{id}` | No | Duplica a `/api/trends/opposing` |
| `GET /health` | No desde la web | Lo usa Render como comprobación de vida |

Las nueve variables salen de la API con datos reales. No se borró ningún punto sin uso: quitar
superficie de la API el día de la demo no aporta y puede romper algo que no se ve desde aquí.

---

## 3. Datos simulados o inventados

### 3.1 Backend: el generador sintético

`SyntheticClimateData` fabricaba una serie anual y un mapa de valores para GISTEMP, NDVI, GRACE y CO₂
cuando la variable no tenía dataset. Con las nueve variables ya sembradas parecía código muerto, pero
no lo era: **la siembra corre en segundo plano al arrancar, y hasta que termina la API declaraba las
variables como `synthetic` y servía esas series.**

Medido con la imagen de `development` en un contenedor (0,25 CPU):

| Memoria del contenedor | Qué pasó |
| :--- | :--- |
| 512 MB (lo que tiene Render) | Responde a los 2,9 s con las 9 variables `synthetic`. Primera variable real a los 48,0 s. **Muerto por falta de memoria a los 77,1 s**, con 6 de 9 cargadas |
| 1 GB | Las 9 variables reales a los 85,9 s; memoria máxima vista, 430,5 MiB |

En Render hoy la siembra termina, pero va al límite, y el servidor gratuito se duerme: cada vez que
despierta repite esa ventana. Es lo que se vio la noche del 14: las cuatro variables como `synthetic`.

**Hecho:**
- Eliminado `SyntheticClimateData.cs`. Sin dataset, `/api/trends` devuelve la serie vacía con
  `source: "unavailable"` y `/api/trends/observations` una lista vacía.
- `/api/datasets` ya no dice `synthetic`: dice `observed`, `loading` (la siembra no ha terminado) o
  `unavailable`.
- **La base de datos se carga al construir la imagen** (nueva etapa `seed` del `Dockerfile`). Al
  arrancar, la API sólo comprueba que el hash de cada Parquet coincide.

| Medida (contenedor de 512 MB, 0,25 CPU) | Antes | Después |
| :--- | ---: | ---: |
| Variables reales en la primera respuesta de la API | 0 de 9 | **9 de 9** |
| Tiempo hasta tener las 9 | no llega (muere a los 77,1 s) | 3,7 s y 8,8 s en dos arranques |
| Memoria durante el arranque | 430,5 MiB (con 1 GB) | 38,8 MiB |

Coste: la imagen pasa de 854 MB a 1,18 GB, y la siembra ocurre en la construcción (unos 20 s, con un
pico de 667 MB). Si esa etapa falla, la herramienta sale con error y la construcción se detiene: no se
despliega una base a medias, y Render conserva la versión anterior.

### 3.2 Frontend: el escenario de demostración

`services/datasetCatalog.ts` esperaba 6 segundos al catálogo y, si no llegaba, **pintaba un escenario
ficticio** para GISTEMP, NDVI, GRACE y CO₂ (rotulado «Datos simulados»). Un servidor dormido tarda
más de 6 segundos en despertar, así que la primera visita podía ver datos inventados.

**Hecho:**
- Borrada la carpeta `services/demo/` (5 archivos, 530 líneas) y todas las ramas `source === 'demo'`.
  El tipo `DataSource` sólo admite `'api'`.
- Sin datos, la web espera: pregunta de nuevo cada 4 s durante 3 minutos y muestra un aviso
  («Conectando con los datos de la NASA…», «El servidor está cargando los datos…»). Si no llegan,
  lo dice: «No se muestran datos simulados en su lugar».
- El asistente también vuelve a consultar el catálogo mientras está abierto.

Visto en el navegador: con la API apagada, aviso de conexión y el globo sin columnas; al encender la
API, los datos reales aparecen solos, sin recargar, y el aviso desaparece.

### 3.3 Contenido ilustrativo que se presentaba como dato

| Dónde | Qué decía | Qué es en realidad | Ahora dice |
| :--- | :--- | :--- | :--- |
| Lista de variables | «Nivel del mar · Altimetría», marcado como activo | La API no tiene esa variable | «Previsto · sin datos» |
| Capa de corrientes | «Corrientes oceánicas 3D (ECCO/OSCAR) · Operativo» | Trazos dibujados a mano; no se carga ningún dato de ECCO ni OSCAR | «Corrientes principales (esquema) · Ilustrativo» |
| Capa de teleconexiones | «Teleconexiones climáticas (ENSO/AMOC) · Operativo» | Arcos entre pares calculados por la API, más dos procesos de contexto dibujados | «Arcos de tendencias opuestas y dos procesos de contexto · Calculado + ilustrativo» |
| Capa de ondas | «Ondas radar de focos extremos · Operativo» | Marcadores en los extremos de esos mismos arcos | «Marcadores en los extremos de cada arco · Calculado» |
| Satélites | «Constelación satelital en órbita · Operativo» | Órbitas nominales, aceleradas y con la altura exagerada; no es su posición real | «Satélites en órbitas nominales · Ilustrativo» |
| Hito de 2026 | «Misión NASA Earth Trend Detective · Misión activa», «petabytes de datos» | Es el proyecto de un equipo de estudiantes | «NASA Space Apps Challenge 2026 · Este proyecto… no una misión de la NASA» |
| Hito de 2015 | «limitar el calentamiento a 1,5 °C» | El acuerdo dice muy por debajo de 2 °C y esforzarse por 1,5 °C | Corregido |
| Hitos de 2005 y 2015 | «Primera evidencia satelital de…», «inventarios globales basados en satélite» | Afirmaciones que no se pueden respaldar | Reescritas en términos prudentes |

Los rótulos se cambiaron en español y en inglés.

**Revisado y dejado como estaba, con su motivo:**
- Los dos arcos de contexto (ENSO y polvo del Sahara): son procesos físicos reales, y su etiqueta ya
  decía «Proceso físico · ilustrativo».
- Los parámetros orbitales de los satélites son los nominales que publica la NASA.
- Las cifras de los demás hitos (Larsen B, mínimo de hielo de 2012, anomalías de 2016, 2023 y 2024)
  están citadas de NASA, NSIDC y NOAA. **No las recalculé con nuestros datos.**
- `satelliteModel.ts` usa números aleatorios sólo para la textura de un modelo 3D de reserva.

---

## 4. Rendimiento

### 4.1 Dónde se iba el tiempo

Medido en vivo sobre Render antes de tocar nada (`curl`, con Brotli):

| Petición | Primera vez | Repetida | Tamaño |
| :--- | ---: | ---: | ---: |
| Mapa de tendencias, temperatura MERRA-2 | 36,2 s | 1,83 s | 1.245.745 B |
| Mapa de tendencias, precipitación MERRA-2 | 28,1 s | — | 1.228.408 B |
| Mapa de tendencias, GISTEMP | 20,4 s | 1,46 s | 957.087 B |
| Mapa de tendencias, GRACE | 6,0 s | — | 444.728 B |
| Valores de un año (GISTEMP 2025) | 1,13 s | 0,82 s | 359.575 B |
| Tendencia de una celda | 0,96 s | 0,55 s | 957 B |
| Catálogo | 0,50 s | 0,45 s | 3.873 B |

El problema era uno: el mapa de tendencias. Tres causas, medidas:

1. **La estadística por celda.** Perfil en local, 16.200 celdas de 45 años: 3.040 ms, de los que 2.137
   (el 70 %) eran el Mann-Kendall con preblanqueo añadido el día 14, que ordenaba todas las pendientes
   en cada vuelta. Además el mapa calculaba la prueba t y el intervalo de confianza, que nunca envía.
2. **La caché.** Guardaba como mucho 4 mapas y los olvidaba a los 5 minutos sin uso.
3. **Cada petición** volvía a serializar unos 5 MB de JSON y a comprimirlos.

### 4.2 Qué se hizo

- **Camino ligero para el mapa** (`TrendStatisticsEngine.AnalyzeCell`): sólo lo que el mapa envía.
- **Mediana por selección** (`OrderStatistics`) en vez de ordenar; el preblanqueo trabaja con arreglos
  reutilizados.
- **Caché del cuerpo ya comprimido** (`GridTrendCache`), sin caducidad por inactividad, con cabida
  para los 9 mapas por defecto más otros 11.
- **Mapas por defecto dentro de la imagen** (`GridFileStore`, `GridWarmupService`): el mapa de cada
  variable sobre todo su periodo, que es el que pide la web por defecto, se calcula **al construir la
  imagen** y viaja como archivo junto a la base de datos. Al arrancar sólo se leen. Un mapa sin archivo
  (desarrollo local) se calcula en segundo plano, como en la primera versión de hoy.
- **Tabla anual** (`fact_annual_cell`, `Etl/AnnualCellTable.cs`): el valor anual de cada celda se
  calcula una vez, al cargar el dataset, en vez de reducir los meses a años en cada mapa. Sección 4.5.
- **Cabeceras de caché HTTP** en el mapa y en los valores por año. Un año vacío no se cachea.
- **Un mapa cada vez**: la caché tiene una compuerta, y las peticiones simultáneas del mismo mapa
  comparten un solo cálculo.

### 4.3 Antes y después

Estadística del mapa, en local (compilación Release). **Las cifras son idénticas en las 16.200 celdas.**

| Caso | Antes | Después |
| :--- | ---: | ---: |
| 16.200 celdas × 45 años | 3.040 ms | 821 ms |
| 16.021 celdas × 26 años | 913 ms | 311 ms |
| 5.832 celdas × 21 años | 224 ms | 74 ms |

Contenedor con 0,25 CPU. «Antes» con 1 GB, porque con 512 MB la versión anterior no sobrevive:

| Petición | Antes | Después (512 MB) |
| :--- | ---: | ---: |
| Mapa de temperatura MERRA-2, primera vez | 22,2 s | 0,05 s |
| Mapa de GISTEMP, primera vez | 6,05 s | 0,04 s |
| Mapa de precipitación MERRA-2, primera vez | 12,5 s | 0,005 s |
| Mapa de GRACE, primera vez | 2,2 s | 0,003 s |
| Mapa de un periodo no precalentado (temperatura, 1990–2025) | del orden de 22 s | 4,8 s; repetido, 0,004 s |
| Tamaño del mapa de temperatura | 1.245.745 B | 335.395 B |
| Tamaño del mapa de GISTEMP | 957.087 B | 199.790 B |
| Dos mapas pesados a la vez | error 500 | 200 y 200 (3,4 s y 8,4 s) |

Esa tabla se midió con la primera versión de hoy, que calculaba los 9 mapas al arrancar (38,6 s en
total: GISTEMP 5,1 s; temperatura 7,1 s; precipitación 7,0 s; GPM 2,6 s; el resto, menos de 2 s cada
uno). En la versión final los mapas por defecto se leen de la imagen y están listos entre 4,9 y 7,7 s
después de arrancar el contenedor (siete arranques); responden en 0,003–0,12 s, igual que en la tabla.
Un periodo no precalculado tarda de 0,3 a 3,5 s; el primero tras arrancar, 6,2–6,4 s, porque el código
de la estadística se compila en ese momento.

En el navegador, contra la API local: el mapa de GISTEMP llega en 70 ms y transfiere 200 KB (4,97 MB
descomprimidos). Al recargar, los valores del año salen de la caché del navegador sin pedir nada.

El error de los dos mapas a la vez era de DuckDB: `Out of Memory Error: failed to allocate data of size
8.0 MiB (100.7 MiB/104.9 MiB used)`. **Eso ya podía ocurrir en producción** si dos personas pedían
mapas distintos al mismo tiempo.

### 4.4 El globo 3D en equipos sin tarjeta gráfica

El sábado la web se probó en el portátil de un compañero y en el de un jurado: no terminaba de cargar
y se trababa. Para reproducirlo sin esos equipos se montó un banco, `scripts/benchmark-weak-laptop.mjs`:
Edge sin ventana dibujando WebGL **por software** (SwiftShader, sin tarjeta gráfica), pantalla de
1366×768 y la CPU frenada ×4. Es a propósito un caso peor que un portátil real con gráfica integrada.

El banco da dos cifras por tramo, porque no son lo mismo: cuántas veces por segundo el navegador
atiende a la página («hilo libre», lo que se nota al hacer clic) y en cuántos de esos cuadros el globo
dibujó de verdad. Sin la segunda, una escena en reposo parecería un milagro.

**Primer intento, rechazado.** La primera solución de hoy fue un «modo ligero» que quitaba nubes,
atmósfera, relieve, cielo, satélites y suavizado de bordes. Subía a 23,5 cuadros/s, pero Diego lo
rechazó al verlo: «se ve horrible, ¿no es mejor optimizarlo pero que mantenga el diseño?». Tenía
razón también en lo técnico, como muestra la medida siguiente. Ese modo ya no existe en el código.

**Dónde se iba el tiempo.** Se midió el coste de cada elemento por separado, dibujando sin parar
(software, 1366×768, CPU ×4):

| Escena | ms por cuadro |
| :--- | ---: |
| Sólo el globo, los datos, los arcos y las estrellas | 45,9 |
| + nubes | +4,9 |
| + atmósfera | +6,7 |
| + cielo (Vía Láctea, Sol y Luna) | +7,9 |
| + relieve y texturas de 4K | +9,7 |
| + suavizado por hardware (multimuestreo) | +12,9 |
| + los cuatro modelos de satélite | +19,0 |
| **Todo el diseño, sin multimuestreo** | **86** |
| **Todo el diseño, con multimuestreo (como estaba)** | **204** |

Lo visual, pieza a pieza, cuesta poco. Lo caro era el multimuestreo aplicado a todo a la vez (118 de
los 204 ms) y la geometría de los satélites: 156.366 triángulos en 88 órdenes de dibujo para cuatro
objetos de unos 60 píxeles. Con todo el diseño y sin multimuestreo, el cuadro cuesta 86 ms a
resolución completa, 70 ms al 75 % y 59 ms al 50 %; un cuadro con el doble de píxeles por lado, 189 ms.

Un perfil del hilo principal mientras se gira lo confirma: el 80,1 % del tiempo es espera al dibujado
por software, el 13,3 % es three.js y el código propio no llega al 0,5 %. No había nada que ganar
optimizando JavaScript. El rayo que Globe.gl lanza en cada cuadro para detectar el ratón, que parecía
sospechoso, no influye (17,0 frente a 16,8 cuadros/s).

**Qué se hizo.** El contenido de la escena es el mismo en todos los equipos; cambia cuándo y con
cuántos píxeles se dibuja (`components/Globe/frameGovernor.ts`, `renderQuality.ts`, `sceneFrames.ts`):

1. **Dibujar sólo cuando algo cambia.** Globe.gl redibuja en cada cuadro aunque nada se mueva. Ahora
   la escena dibuja mientras gira la cámara, dura una transición o llega algo (una textura, una tesela,
   un modelo, el resaltado de una columna) y después se detiene. En reposo no cuesta nada.
2. **Menos píxeles sólo mientras se mueve, y sólo si hace falta.** Si al moverse baja de 22 cuadros/s,
   la resolución baja por pasos (hasta la mitad); si va sobrada, vuelve a subir. Al parar se dibuja un
   cuadro a resolución completa.
3. **El suavizado se conserva por otra vía donde el multimuestreo es caro.** Con dibujo por software,
   el cuadro en reposo se dibuja con el doble de píxeles por lado y el navegador lo reduce: cuatro
   muestras por píxel, como el multimuestreo, pagadas una sola vez.
4. **Satélites más ligeros** (`scripts/satellites/reduce_satellite_models.py`, Blender): de 156.366 a
   39.961 triángulos, de 88 a 40 órdenes de dibujo y de 2,26 MB a 0,69 MB. Comparados en capturas
   ampliadas cuatro veces, no se distinguen. Esto beneficia a todos los equipos.
5. **La inercia al soltar dura lo mismo en un equipo lento.** Los controles amortiguan una fracción
   fija por cuadro, así que a 17 cuadros/s el deslizamiento duraba más del triple. Ahora se ajusta a
   los cuadros medidos.
6. **La textura de 8K no se pide en los perfiles bajo demanda** (4,25 MB y unos 170 MB de memoria de
   vídeo). Las de 4K, las teselas de detalle y todo lo demás se cargan igual.

Tres perfiles, elegidos al cargar según la gráfica (se pueden forzar con `?quality=`, y hay un
interruptor en Escena → Vista → «Dibujo adaptable»):

| Perfil | Para | Multimuestreo | Dibuja |
| :--- | :--- | :--- | :--- |
| `full` | Tarjeta gráfica dedicada | Sí | Siempre, como hasta ahora |
| `adaptive` | Gráfica integrada (Intel, Mali, Adreno), poca memoria o pocos núcleos | Sí | Siempre mientras el equipo vaya rápido; bajo demanda si no |
| `lean` | Dibujo por software, o cualquier equipo que resulte lento en otro perfil | No; reposo supermuestreado | Bajo demanda |

El equipo se juzga en ventanas tranquilas, justo antes de reposar, porque las medidas tomadas
mientras carga la página mezclan trabajo que no dice nada de la máquina. Un equipo que no llega ni a
media resolución pasa solo a `lean`, y el cambio (que reconstruye la escena) se hace con la escena
quieta, nunca en mitad de un arrastre. Una elección manual no se pisa.

**Resultado**, mismo banco para las tres columnas (la primera es la web en producción):

| Medida | Producción | Compilación nueva, `full` forzado | Compilación nueva, automático (`lean`) |
| :--- | ---: | ---: | ---: |
| En reposo, hilo libre | 5,2 /s | 8,2 /s | **60 /s** (0 cuadros dibujados) |
| Girando el globo, cuadros dibujados | 5,2 /s | 8,3 /s | **18,9–19,6 /s** |
| Resolución del lienzo girando / en reposo | 1366×768 / 1366×768 | 1366×768 / 1366×768 | 683×384 / **2732×1536** |
| Órdenes de dibujo por cuadro | 129–130 | 102–104 | 100–101 |
| Página bloqueada antes de tocar nada (tareas de más de 50 ms) | 91 tareas, 22,4 s | 128 tareas, 20,9 s | 33–37 tareas, **7,6–8,3 s** |
| Página bloqueada en toda la prueba | 46,1 s | 35,8 s | 14,5–16,3 s |
| Datos reales en pantalla | 9,2 s (otra red y otra API) | 6,9 s | 6,6–7,7 s |
| Tras soltar, cuadro final nítido | — | — | a los 1,5–1,6 s |
| Descargado | 6,88 MB | 6,04 MB | 6,04 MB |
| Memoria de JavaScript | 82 MB | 67 MB | 65 MB |

La columna `lean` son cuatro pasadas. La columna central muestra lo que ganan los satélites reducidos
por sí solos, sin cambiar nada más: de 5,2 a 8,3 cuadros/s. Mientras el globo gira en `lean` no hay
suavizado y la resolución es la mitad (en este caso peor): se nota al arrastrar y desaparece al soltar.

Las otras rutas, medidas con el mismo banco:

- **Gráfica integrada lenta** (se anuncia a la página una Intel UHD 620 mientras se dibuja por
  software): arranca en `adaptive`, las dos ventanas de prueba salen lentas y pasa a `lean` al terminar
  la carga, antes del primer arrastre; después, 19,7 cuadros/s al girar.
- **Equipo mal detectado como potente** (se anuncia una RTX 3050): arranca en `full`, el vigilante lo
  nota y pasa a `lean`; 19,5–20 cuadros/s. Ese equipo acumula unos 14 s bloqueado antes del cambio.
- **Gráfica real** (RTX 4060, CPU ×4) con `?quality=adaptive`: la escena se queda viva, 126–131
  cuadros/s dibujados en reposo y 114–124 girando, igual que en `full` (128 y 125).

**Comportamiento comprobado** con `scripts/check-adaptive-rendering.mjs` (cuenta órdenes de dibujo y
guarda capturas): en reposo no dibuja; al pasar el ratón por una columna dibuja unos cinco cuadros y
vuelve al reposo; al arrastrar baja la resolución y al soltar la recupera; tras un zoom las teselas se
ven aunque lleguen con la escena ya quieta; el interruptor de estrellas, la lectura de tendencias
(16.021 celdas) y el cambio de perfil en caliente en los dos sentidos funcionan y conservan los datos
(3.151 muestras); sin errores en la consola.

**Fallos que destaparon las medidas** (míos, corregidos):

- Al cambiar de perfil la escena se reconstruye, y la página sólo le envía los datos cuando cambian:
  el globo quedaba **sin columnas**. Lo delató una medida demasiado buena (40 cuadros/s con 11 órdenes
  de dibujo en vez de 24). La escena recuerda ahora lo último que recibió y la vista de la cámara.
- **El banco no giraba el globo.** El asistente abre con un velo que cubre el lienzo, y el arrastre
  simulado nunca llegaba. Las cifras «girando» de la primera versión de esta nota medían el dibujo,
  pero no un giro real. El banco cierra ahora el asistente y todas las cifras de esta sección están
  repetidas así, incluidas las de producción.
- El cambio automático a `lean` saltaba **en mitad del primer arrastre** y lo interrumpía. Ahora espera
  a que nada se mueva.

### 4.5 Memoria: por qué el servidor se moría y cómo quedó

Al verificar la imagen final con un mapa de un periodo distinto del precalculado, **el contenedor de
512 MB murió** (`OOMKilled=true`, código 137). No era casualidad: se montó una serie de estrés
(`scripts/stress-api-memory.sh`: 16 mapas de periodos no precalculados, uno tras otro, y dos a la vez)
y se repitió con cada cambio. Todo medido en un contenedor de 512 MB y 0,25 CPU.

**Lo que se encontró:**

1. **Cada mapa calculado dejaba el proceso más alto y no bajaba**: 157 MiB al arrancar, 439 MiB tras
   nueve mapas, muerto en el décimo. No era memoria de .NET: el registro nuevo
   (`Trend grid computed: … process 508 MB, managed heap 13 MB`) muestra el montón gestionado por
   debajo de 40 MB mientras el proceso pasaba de 500. Leyendo `/proc/1/smaps` dentro del contenedor, lo
   que crecía eran regiones anónimas (45 → 281 MiB en seis mapas): memoria que DuckDB ya había
   liberado y su asignador no devolvía al sistema. El límite `memory_limit` de DuckDB acota lo que
   usa, no lo que su asignador retiene.
2. **Una consulta que agota el límite de DuckDB lo deja inservible.** Reducir los 5,1 millones de
   hechos mensuales de GISTEMP a años, dentro de cada petición, va al borde de los 110 MB permitidos.
   Cuando falló (`Out of Memory Error: failed to allocate data of size 4.0 MiB (103.5 MiB/104.9 MiB
   used)`), **las cinco peticiones de mapa siguientes fallaron con el mismo mensaje** en menos de un
   segundo, también las de otras variables, y el proceso saltó de 254 a 493 MiB. No se recuperó solo
   en lo que duró la prueba; se arregla reiniciando.
3. El precalentado al arrancar de la primera versión de hoy lo empeoraba: dejaba el proceso en
   336 MiB antes de atender a nadie.

Las dos primeras no dependen de los cambios de hoy: la consulta del mapa y los límites de DuckDB eran
los mismos que hay en producción. No lo medí sobre la imagen de producción.

**Lo que se hizo:**

- **Los mapas por defecto se calculan al construir la imagen** y se leen al arrancar (1,7 MB en nueve
  archivos, cada uno con su SHA-256 al lado; el nombre lleva cobertura, hash de la fuente y número de
  filas, así que un archivo de otra versión del dataset se ignora). El servidor ya no ejecuta esas
  nueve consultas pesadas.
- **Tabla anual** `fact_annual_cell`: al cargar un dataset se guarda el valor anual de cada celda, año
  a año. El mapa lee filas ya anuales en vez de agregar millones de filas mensuales. Mismas reglas que
  la consulta anterior (mismo agrupamiento, mismo filtro de nulos, mismo mínimo de meses). Una variable
  sin filas anuales usa la consulta antigua.
- **El asignador de DuckDB devuelve memoria** (`DuckDb:AllocatorBackgroundThreads` y
  `DuckDb:AllocatorFlushThreshold`, fijados en el `Dockerfile`).
- **Recolección de memoria de .NET tras cada mapa calculado** y una línea de registro por mapa con la
  memoria del proceso y la gestionada, para poder verlo en Render.

| Versión | Mapas por defecto listos | Memoria al arrancar | Tras 9 mapas no precalculados | Mapa nº 10 (GISTEMP 1880–2026) | Al final de la serie |
| :--- | ---: | ---: | ---: | :--- | :--- |
| Precalentado al arrancar (primera versión de hoy) | 38,6 s | 336 MiB | — | Muerto por memoria en la primera petición | — |
| Mapas en la imagen | 5,8 s | 157 MiB | 439 MiB | Muerto por memoria | — |
| + ajustes del asignador | 4,9 s | 152 MiB | 254,5 MiB | Error 500 de DuckDB; todo falla desde ahí; muerto poco después | — |
| + tabla anual, sin ajustes del asignador | 7,7 s | 160,5 MiB | 384 MiB | 200 en 2,2 s | Vivo, 369 MiB, 0 errores |
| **Final: tabla anual + asignador** (tres pasadas) | 5,1–7,3 s | 153–154 MiB | 225–248 MiB | 200 en 2,1–2,2 s | **Vivo, 229–253 MiB, 0 errores** |

En las tres pasadas finales los 16 mapas respondieron 200 y la memoria se movió entre 176 y 267 MiB;
el valor más alto visto, 321 MiB, con dos mapas pedidos a la vez.

**Los números del mapa no cambian.** Los nueve mapas por defecto calculados desde la tabla anual pesan,
comprimidos, exactamente lo mismo que los calculados desde los hechos mensuales (199.790, 67.972,
116.135, 32.549, 335.395, 355.487, 132.389, 118.566 y 295.567 bytes), y un test compara las dos
consultas serie a serie (sección 5). En el navegador, GISTEMP 2000–2026: 16.021 celdas, 9.843
significativas sin corregir, 8.449 tras el preblanqueo y 7.117 tras el control de falsos
descubrimientos.

Coste: la base de datos dentro de la imagen pasa a 273 MB y la imagen a 1,22 GB (854 MB antes de hoy).

---

## 5. Tests y comprobaciones

- Backend: **243 de 243** (213 antes). Nuevos:
  - `GridFastPathTests`: el camino ligero da los mismos números que el completo en 600 series (con
    empates, huecos y años desordenados), y la mediana por selección coincide con la mediana por orden.
  - `GridTrendCacheTests`: el cuerpo guardado es el mismo JSON que enviaría la API; ocho peticiones
    simultáneas comparten un cálculo; dos mapas distintos nunca se calculan a la vez; una variable sin
    dataset no se guarda; el catálogo dice `loading` y luego `unavailable`, nunca `synthetic`.
  - `DatasetsControllerIntegrationTests`: las cuatro variables que tenían serie de demostración
    devuelven vacío sin dataset.
  - `DatasetSeederTests`: la tabla anual da **las mismas series** que reducir los hechos en cada
    petición (con un mes sin valor y un año incompleto, y mínimos de 1, 9 y 12 meses); una base cargada
    antes de existir la tabla recibe sus filas anuales sin reimportar.
  - `GridFileStoreTests`: un mapa guardado se lee para el mismo dataset; no se usa si cambia el hash,
    el número de filas o la cobertura; un archivo truncado se ignora (un Brotli truncado se expande sin
    dar error: por eso lleva SHA-256).
  - `DuckDbResourceLimitTests`: los ajustes del asignador se validan y DuckDB los acepta.
- Los tests de validación estadística (SciPy y el prototipo del preblanqueo) siguen pasando a 6
  decimales con el código optimizado.
- Frontend: `type-check` y `build` sin errores; React Doctor, 0 avisos (39 archivos en el primer commit, 18 en el segundo). El script
  `lint` del frontend no se pudo pasar: `eslint` no está instalado en el proyecto.

---

## 6. Qué cambia para quien usa la API

- `/api/datasets`: el campo `status` vale `observed`, `loading` o `unavailable`. Antes, `observed` o
  `synthetic`. La web sólo compara con `observed`, así que la versión desplegada sigue funcionando.
- `/api/trends`: `source` vale `observed` o `unavailable`.
- `/api/trends/grid`: mismo JSON. Llega con `Content-Encoding: br` y `Cache-Control`.
- No hay modo de demostración: se quitaron `VITE_OBSERVATION_DATA_SOURCE`, `VITE_HEX_DATA_SOURCE` y
  `VITE_HEX_DEMO_PROFILE`.
- Base de datos: tabla nueva `fact_annual_cell`. Se rellena sola al sembrar; una base ya cargada la
  recibe en el siguiente arranque, sin reimportar.
- Configuración nueva, toda opcional: `GridCache:Directory` (carpeta de los mapas por defecto),
  `GridCache:ExportAndExit` (sólo para la construcción de la imagen), `DuckDb:AllocatorBackgroundThreads`
  y `DuckDb:AllocatorFlushThreshold`. Sin ellas, en local, todo funciona como antes.
- Web: parámetro `?quality=full|adaptive|lean` y el interruptor «Dibujo adaptable» en Escena → Vista.
- Los cuatro modelos de satélite (`frontend/public/models/satellites/*.glb`) son versiones reducidas
  de los anteriores; los originales están en el historial de git.

---

## 7. Qué NO se hizo, y por qué

**Despliegue**

1. **No está desplegado ni probado en Render.** Las medidas son de un contenedor local con sus mismos
   límites (512 MB, 0,25 CPU). Falta fusionar, promover a `production` y mirar el registro del primer
   despliegue: debe decir `Unchanged` en los nueve datasets y nueve líneas `Trend grid loaded from the
   image`.
2. **La memoria que tiene Render para construir la imagen no la sé.** La etapa de siembra llegó a
   667 MB (medido antes de añadir la tabla anual y la exportación de mapas; no lo volví a medir). Si no
   cupiera, la construcción falla y Render se queda con la versión anterior.
3. **La caché en el borde de Vercel no está comprobada.** Las cabeceras están puestas; si Vercel las
   respeta en su proxy sólo se ve desplegado (cabecera `x-vercel-cache`).

**Backend**

4. **Si DuckDB vuelve a agotar su límite, el servidor no se recupera solo.** Se quitó la causa que se
   encontró (la agregación mensual en cada mapa), pero no hay recuperación automática, y `/health`
   responde «Healthy» sin consultar la base de datos, así que Render no lo notaría. No lo cambié porque
   no puedo comprobar desde aquí cómo reacciona Render a un `/health` en rojo. Síntoma: errores 500 con
   `Out of Memory Error` en el registro. Remedio: reiniciar el servicio (arranca en segundos).
5. **Los dos ajustes del asignador se probaron juntos.** El umbral solo no cambió nada (medido); los
   hilos de fondo solos no los medí.
6. **El primer mapa no precalculado tras arrancar tarda 6,2–6,4 s**, porque la estadística se compila
   en ese momento. Antes el precalentado lo dejaba compilado.
7. **Los valores de un año (`/api/trends/observations`) y la tendencia de una celda siguen leyendo los
   hechos mensuales.** Son consultas pequeñas (un año o una celda) y no fallaron en ninguna prueba.
8. **Puntos de la API sin uso** (sección 2): inventariados, no eliminados.

**Frontend**

9. **No se probó en los portátiles que fallaron el sábado.** Todas las cifras son del equipo simulado.
   Conviene abrir la web en uno de ellos; en la consola, `document.documentElement.dataset.quality`
   dice qué perfil eligió, y el interruptor «Adaptive rendering» de Scene → View debe salir encendido.
10. **El perfil `adaptive` no se midió en una gráfica integrada real.** Su lógica está probada sobre la
    RTX 4060 (se queda viva) y con una Intel anunciada sobre dibujo por software (pasa a `lean`), pero
    no sé cuánto rinde una Intel de verdad con multimuestreo.
11. **En `lean`, mientras el globo se mueve, no hay suavizado y la resolución puede bajar a la mitad.**
    Es el precio de que responda; al soltar vuelve la imagen nítida en 1,5–1,6 s.
12. **En reposo las animaciones se detienen** (satélites, ondas) en `lean`, y en `adaptive` si el equipo
    no es rápido. Vuelven en cuanto se toca el globo.
13. **Los umbrales** (22 y 50 cuadros/s, 140 ms para dar un giro por terminado, pasos de ×0,75) los elegí
    yo; no están ajustados con equipos reales. La detección por nombre de la gráfica es una lista: una
    integrada de AMD no está en ella y depende del vigilante de cuadros.
14. **Los satélites reducidos** se compararon en capturas ampliadas; no los miré con la cámara pegada a
    uno de ellos.
15. **En `full` no cambia nada** salvo los satélites, más ligeros.
16. **El paquete del frontend sigue siendo un solo archivo de 2,60 MB** (753 KB con gzip). No se partió.
17. **No se volvió a probar en móvil.** Un móvil entra ahora en `adaptive` (antes dibujaba siempre).
18. **Los textos nuevos** en inglés y español los escribí yo: conviene que alguien del equipo los lea.
19. **Sin dataset la web espera 3 minutos** antes de rendirse. Es un valor elegido, no medido en Render.

**Contenido**

20. **Las corrientes oceánicas siguen siendo un esquema**, ahora rotulado. No se cargaron datos de OSCAR.
21. **Los satélites siguen en órbitas nominales**, ahora rotulado. No se usan sus posiciones reales.
22. **Las cifras de los hitos** no se recalcularon con nuestros datos: están citadas.
23. **Quedan en el repositorio los scripts y documentos históricos del escenario de demostración**
    (`scripts/build-global-hex-demo.py`, `scripts/build-hex-demo-coverage.py`,
    `scripts/benchmark-*-browser.js`, `docs/s2-*.md`, `docs/validation/hex-demo-*.json`). Ya no generan
    ni miden nada que use la web; no los borré porque son historia del equipo.

---

## 8. Cómo reproducir las medidas

```bash
# Imagen y contenedor con los límites de Render
docker build -t nasa-api:nuevo -f backend/Dockerfile backend
docker run -d --name nasa --memory=512m --memory-swap=512m --cpus=0.25 -p 5081:5000 nasa-api:nuevo
docker logs nasa | grep "Trend grid loaded from the image"

# Latencia y tamaño de un mapa
curl -s -H "Accept-Encoding: br" -o /dev/null -w "%{time_total}s %{size_download}B\n" \
  "http://localhost:5081/api/trends/grid?variable=5&startYear=1981&endYear=2025"

# Estado en vivo
curl -s https://nasa-trend-detective-api-72rq.onrender.com/api/datasets

# Serie de estrés de memoria (sección 4.5): 16 mapas no precalculados en 512 MB
scripts/stress-api-memory.sh nasa-api:nuevo 512m

# Banco de equipo flojo (sección 4.4): Node 22 o superior y Edge o Chrome
node scripts/benchmark-weak-laptop.mjs https://nasa-earth-trend-detective.vercel.app/ "produccion"
node scripts/benchmark-weak-laptop.mjs "http://localhost:4173/?quality=full" "completo"
node scripts/benchmark-weak-laptop.mjs http://localhost:4173/ "automatico" software 4 captura.png
# Equipo mal detectado: anuncia una tarjeta potente (o una integrada) mientras dibuja por software
node scripts/benchmark-weak-laptop.mjs http://localhost:4173/ "mal detectado" software 4 "" "ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0)"
node scripts/benchmark-weak-laptop.mjs http://localhost:4173/ "integrada lenta" software 4 "" "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)"
# Con la tarjeta real del equipo
node scripts/benchmark-weak-laptop.mjs "http://localhost:4173/?quality=adaptive" "adaptable, GPU real" gpu

# Comportamiento del dibujo bajo demanda (sección 4.4), con capturas
node scripts/check-adaptive-rendering.mjs http://localhost:4173/ ./capturas

# Reducir los modelos de satélite (no hace falta repetirlo: los reducidos ya están en el repositorio)
blender -b --factory-startup --python scripts/satellites/reduce_satellite_models.py -- <carpeta con los .glb> <carpeta de salida> 12000
```

`http://localhost:4173` es la compilación de producción del frontend (`npm run build` y
`npm run preview --workspace=frontend`), con la API del contenedor en el puerto 5000.

Relacionado: [[40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia]] (el preblanqueo que aquí se
optimiza), [[10-Despliegue-Cloud-Vercel-Render]] y [[38-Como-Funciona-El-Detective-De-Tendencias]].
