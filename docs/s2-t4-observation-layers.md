# S2-T4 — observaciones anuales, hexágonos 3D y mapa de calor

Este documento describe el montaje actual del frontend. Sustituye la presentación anterior de columnas de pendientes simuladas. La geometría, la selección optimizada y las fuentes geográficas de aquel trabajo se reutilizan; sus unidades por año y su fuente `/trends` no alimentan estas capas.

## Qué se está mostrando

La entrada es `ClimateObservation`: una observación para una variable, año y coordenadas. **Una anomalía de temperatura en °C no es una temperatura absoluta ni una pendiente en °C/año.** NDVI y CO₂ muestran el valor de la observación; temperatura y agua/hielo usan `anomaly` cuando está declarada. No se calculan pendientes de Sen, pruebas Mann–Kendall, confianza o significancia a partir del color o la altura.

El año activo selecciona la observación. El inicio del periodo del timeline no transforma esa lectura en una tendencia estadística. El inspector demo puede mostrar la serie del mismo escenario ficticio, pero mantiene el aviso de datos sintéticos y los resultados estadísticos como «Sin calcular».

## Dos representaciones de los mismos datos

En **Variables → Datos → Representación** están `Hexágonos 3D`, `Mapa de calor` y `Sin capa`. Los dos primeros son alternativos; no se superponen. Cambiar la representación no remonta la Tierra ni modifica la composición del espacio de trabajo.

- **Hexágonos 3D:** un prisma por observación, colocado en sus coordenadas. La altura es una magnitud normalizada por una escala fija de la variable; el color conserva el signo cuando corresponde. El cambio de año/variable interpola altura y color durante 800 ms. No se normaliza frente al máximo de cada respuesta, lo que permite comparar años sin que un valor idéntico cambie de escala.
- **Mapa de calor:** media espacial de valores firmados, con radio angular de 4°. No representa densidad de puntos ni suma de valores absolutos. Las ubicaciones repetidas se agrupan antes de ponderar. El raster es de 512×256, respeta el antimeridiano y deja transparentes las zonas sin soporte. Se calcula en un Worker sólo al cambiar datos/variable y cuando se necesita; dos texturas permiten una transición de 800 ms. Si Worker no está disponible, existe cálculo síncrono de respaldo. La animación del render sólo actualiza un uniforme, sin estado React por frame.

El suavizado es una presentación visual, **no una reconstrucción científica validada de la superficie**. Puede extender color alrededor de una muestra hasta su radio de influencia, incluidas inmediaciones de una costa. La cobertura de centros continentales no equivale a un recorte poligonal exacto del raster. Los 4° y la resolución del raster no son la resolución de un satélite.

La opacidad máxima del mapa es 0,60. En las escalas divergentes, cerca de cero se reduce para conservar la superficie visible: `0.15 + 0.85 * abs(value) / maxDomain`, limitada a 1 y multiplicada por cobertura/opacidad. Esta intensidad es presentación, no confianza estadística, y no altera los valores calculados. NDVI/CO₂ usan opacidad independiente del valor. La esfera comparte teselación 90×45 con la Tierra, queda a radio 1,0006 y debajo de las nubes existentes; no sustituye el material terrestre.

## Escenario demo y cobertura

`createDemoObservations(variable, year)` genera un campo ficticio determinista y continuo sobre la esfera. Los ID y las posiciones se mantienen al cambiar de año. `sampleDemoObservation(variable, year, lat, lng)` usa exactamente la misma función para que el valor del inspector y el de una celda seleccionada coincidan.

La vista inicial usa **tierra firme**. Para temperatura y CO₂, `Incluir océanos` permite extenderla a toda la esfera. Vegetación conserva sólo las huellas continentales libres de hielo cartografiado; agua/hielo utiliza las huellas continentales. No hay un hexágono por país ni una promesa de representar todas las islas y países pequeños.

| Variable | Tierra firme, vista inicial | Tierra y océanos disponibles |
| --- | ---: | ---: |
| Temperatura | 1.662 | 8.192 |
| Vegetación / NDVI | 1.458 | 1.458, sigue siendo terrestre |
| Agua / hielo | 1.662 | 1.662, sigue siendo terrestre |
| CO₂ | 1.662 | 8.192 |

Se reutilizan `HEX_GLOBAL_COVERAGE` y `HEX_GLOBAL_FLAGS`: centros Fibonacci y filtros conservadores derivados de MODIS Water Mask y Natural Earth. La [documentación geográfica anterior](s2-global-demo.md#contrato-de-cobertura) conserva las fuentes, hashes y pipeline reproducible. Esos recursos describen geografía; **no aportan los valores climáticos simulados**. Suelo sin hielo no garantiza vegetación; la máscara tampoco representa hielo estacional ni disponibilidad real de un sensor.

`filterObservationCoverage` guarda metadatos demo en un `WeakMap` asociado a los objetos generados. Nunca aplica esa máscara a observaciones recibidas de la API, aunque compartan un ID. En modo API se respeta toda la cobertura recibida y se oculta el control demo de océanos.

## Escalas y unidades

`SCIENCE_SURFACE_COLORS` y `SCIENCE_ACCENTS`, en `scienceTheme.ts`, centralizan los colores. `OBSERVATION_SCALES`, en `colorScales.ts`, centraliza dominio, punto intermedio, unidad y leyenda. Hexágonos, mapa de calor, lectura e inspector comparten sus funciones.

| Variable | Lectura | Dominio visual | Punto intermedio | Progresión de color |
| --- | --- | --- | --- | --- |
| Gistemp | Anomalía en °C | −2 a +2 | 0 | Azul frío → gris mineral → rojo cálido |
| ModisNdvi | NDVI | 0 a 1 | 0,5 | Ocre → verde mineral → clorofila |
| GraceMass | Anomalía en cm H₂O equivalente | −30 a +30 | 0 | Terracota → gris mineral → azul glacial |
| Oco2 | Concentración en ppm | 360 a 450 | 420 | Oliva → violeta → magenta contenido |

Los extremos son límites de presentación: se satura el color/altura fuera del dominio, pero la lectura conserva el valor recibido. No son umbrales de riesgo o significancia. La referencia cromática de 420 ppm sigue el encargo visual y no certifica una línea base científica. Para temperatura/agua, la altura representa magnitud absoluta; el signo sigue visible en el color y la lectura. Para NDVI/CO₂, la altura progresa desde el mínimo del dominio. Interpolación cromática en sRGB y entrega de RGB lineal a Three.js; la leyenda usa la misma escala.

### Contraste y lectura térmica

La paleta de temperatura utiliza azul `#267edf`, neutro `#aaa99d` y rojo `#e44f46`. La intensidad cromática desde cero hacia cada extremo sigue `abs(anomaly / 2) ** 0.65`, limitada al dominio. Esta curva visual simétrica distingue mejor anomalías moderadas; no cambia datos, alturas, signo ni límites −2…+2 °C. Hexágonos, calor y leyenda comparten la función. Las demás variables conservan interpolación lineal.

La leyenda indica «Respecto al promedio de referencia» y el inspector explica rojo/más cálido y azul/más frío, sin confundirlos con temperatura absoluta. Una anomalía positiva puede existir en una región bajo cero. La demo no dispone de una climatología observada ni de un periodo base NASA: su referencia es ficticia; el futuro proveedor debe declarar su periodo de referencia antes de atribuirlo a datos reales.

## Conexión del backend

Configuración del frontend, seguida de reinicio de Vite o reconstrucción:

```dotenv
VITE_OBSERVATION_DATA_SOURCE=demo
# Para activar la respuesta real del servicio del equipo:
# VITE_OBSERVATION_DATA_SOURCE=api
# VITE_API_URL=http://localhost:PUERTO/api
```

El valor predeterminado es `demo`. La selección `api` llama a `trendService.getObservations(variable, year)`, ruta `/trends/observations`. `VITE_HEX_DATA_SOURCE` pertenece al experimento anterior de pendientes y ya no controla el montaje actual. Elegir `api` identifica el transporte; por sí solo no demuestra procedencia NASA.

La API debe devolver una lista de objetos `ClimateObservation` con:

- `id`: string no vacío y único dentro de la respuesta; conviene conservarlo para la misma ubicación entre años.
- `variable`: nombre del enum solicitado, o su valor numérico actual (`1=Gistemp`, `2=ModisNdvi`, `3=GraceMass`, `4=Oco2`).
- `latitude` y `longitude`: números finitos en ±90° y ±180°.
- `value`: número finito; `anomaly`, si existe y no es `null`, también finito.
- `unit`: compatible con la variable. Temperatura admite `°C`/`Celsius` con anomalía explícita, o unidad con `Anomaly`; NDVI admite `NDVI`, `1` o `adimensional`; agua/hielo admite `cm`, `cm H₂O eq.` o `cm water equivalent`; CO₂ admite `ppm`. No hay conversión automática entre metros, centímetros, tasas o concentraciones.
- `timestamp`: fecha ISO con hora y el año solicitado.

Una temperatura en `°C` sin `anomaly` se rechaza: no es posible saber si es absoluta o una anomalía. Si la unidad declara explícitamente `°C Anomaly`, puede usarse `value`. Para agua/hielo, el contrato de la capa interpreta `anomaly ?? value` como variación de agua equivalente; el proveedor debe declarar esa semántica, no enviar una reserva absoluta bajo la misma unidad.

Se rechazan respuestas con unidades mezcladas o incompatibles, contexto incorrecto, números inválidos o IDs repetidos. No hay sustitución silenciosa por demo ante un error de API. `useGlobeData` cancela la entrega de consultas anteriores y no atribuye datos de un año anterior al nuevo contexto. La escena conserva la capa durante la carga para animar cuando llegue la respuesta siguiente; los errores finales limpian los datos de la capa.

El servicio backend de ejemplo observado durante esta integración mezcla una fila NDVI y una fila en °C para cualquier variable solicitada. El adaptador señala ese problema de contrato; no lo convierte en observaciones científicas válidas.

## Inspector y límites de la información

Seleccionar un hexágono abre el inspector en las coordenadas exactas de su centro. El selector accesible permite la misma acción por teclado. El clic sobre la superficie busca la observación más cercana dentro del soporte angular de 4° del mapa de calor y **sólo entre las observaciones de la cobertura activa**. La distancia se calcula sobre la esfera, incluidos polos y antimeridiano. Si la muestra es cercana pero no exacta, se mantienen las coordenadas elegidas y se muestran aparte las coordenadas y separación angular de la muestra. Su lectura no se atribuye al punto pulsado ni a la media interpolada del mapa.

En modo demo, la serie se genera con el mismo campo anual y las coordenadas de la observación encontrada, no con unas coordenadas libres fuera de cobertura. Un clic en el océano con NDVI o la cobertura continental activa no fabrica una serie. En modo API, una respuesta anual sólo permite mostrar la muestra recibida: **no se inventa una serie histórica**. Si no hay muestra dentro del soporte, se indica ausencia de datos y no se genera ninguna serie. La futura serie regional debe llegar de un endpoint/contrato específico.

## Arquitectura y correcciones técnicas al enunciado

Se conserva una instancia Globe.gl, su renderer/canvas, OrbitControls, Tierra, estrellas y ciclo de vida. `earthHexLayer.ts` queda por debajo de 180 líneas: adapta observaciones y controla selección/visibilidad; reutiliza `hexColumns.ts` y `hexPicking.ts`. `earthObservationLayers.ts` coordina los dos modos y `earthAnalysisRoot.ts` proporciona una raíz compartida mediante la API pública `customLayerData`. `useGlobeScene.ts` sólo integra ese controlador. La liberación elimina geometrías, materiales, texturas, Worker y referencias; no crea un renderer adicional.

El enunciado contiene supuestos que no coinciden con las dependencias instaladas (`globe.gl 2.46.2`, `three-globe 2.45.2`, `h3-js 4.5.0`):

1. **El hexbin nativo no usa InstancedMesh.** Su código crea un Mesh por celda; `hexBinMerge` fusiona geometría, con limitaciones para eventos/transiciones individuales. Se conserva la InstancedMesh y selección BVH existentes mediante la capa pública personalizada. [Código oficial de hexbin](https://github.com/vasturiano/three-globe/blob/master/src/layers/hexbin.js), [API Globe.gl](https://github.com/vasturiano/globe.gl#hex-bin-layer).
2. **H3 utiliza resoluciones enteras.** En la versión instalada, `latLngToCell(18,-12,3.5)` devuelve la misma celda que resolución 3 (`835423fffffffff`), no una resolución intermedia. El montaje actual coloca prismas en observaciones: no afirma implementar teselación H3 ni agrupación por países. [API de indexación H3](https://h3geo.org/docs/api/indexing/).
3. **Sumar pesos absolutos cambia el significado del dato.** Hace crecer una columna por cantidad de registros y borra el signo. La altura actual utiliza la magnitud normalizada de la observación; el mapa de calor calcula una media firmada. El heatmap nativo es KDE y su implementación aplica valor absoluto al color, por lo que no se utiliza para representar anomalías firmadas. [Código oficial de heatmaps](https://github.com/vasturiano/three-globe/blob/master/src/layers/heatmaps.js).
4. **Altura `0.45` equivale al 45% del radio terrestre.** El límite actual es `0.03`, aún una exageración analítica deliberada, no relieve geológico. Las caras son opacas, con laterales más oscuros: evita errores de orden y profundidad entre miles de instancias transparentes. Se conserva volumen y legibilidad sin obligar al renderer a ordenar cada prisma.

Estas decisiones cumplen la interacción y semántica del encargo sin copiar parámetros técnicamente problemáticos. El objetivo de 60 FPS debe verificarse con mediciones del montaje final; no se deduce de usar instancias o Worker.

## Verificación

Resultados finales: [validación local y rendimiento](validation/s2-observation-validation.md).

`node scripts/validate-observation-data.cjs` comprueba determinismo, IDs, cambios anuales, filtros, igualdad inspector/celda, extremos cromáticos, unidades, aislamiento API/demo, errores y cancelación. `node scripts/validate-observation-lookup.cjs` comprueba muestra exacta/cercana, soporte finito, polos, antimeridiano y ausencia de NDVI sobre océanos/hielo. Las validaciones de TypeScript, build, navegador y rendimiento se registran al cerrar la integración. No se atribuyen mediciones históricas del renderer de pendientes al montaje actual.
