# Cobertura geográfica del escenario demostrativo S2

El perfil predeterminado es ahora **`global`**: distribuye centros por toda la esfera y selecciona cobertura según la variable. `regional` conserva la comparación anterior en ocho grupos; `stress` es una prueba separada de carga. **Todos los valores siguen siendo ficticios**: la selección geográfica no los convierte en observaciones NASA ni resultados científicos.

## Perfil global predeterminado

| Variable | Celdas globales | Selección visual |
| --- | ---: | --- |
| Temperatura / Gistemp | 8.192 | Tierra y océano. |
| Vegetación / ModisNdvi | 1.458 | Huellas continentales sin hielo cartografiado, con margen costero. |
| Reservas de agua / GraceMass | 1.662 | Huellas continentales, incluidas 204 que intersectan hielo cartografiado. |
| CO₂ / Oco2 | 8.192 | Tierra y océano. |

`VITE_HEX_DEMO_PROFILE=global` es el valor utilizado cuando no se configura el entorno. Los centros Fibonacci son aproximadamente uniformes en área; evitan concentrar muestras en los polos. El filtro offline combina la máscara NASA MODIS de agua con polígonos Natural Earth de tierra y zonas glaciadas. Así la ausencia de datos MODIS en el océano Ártico no se interpreta como terreno.

El [documento del escenario global](s2-global-demo.md) contiene fuentes, hashes, recuentos, reproducción y validación actuales. Su margen costero es de 0,20°, además de la huella visual y la guarda de píxel. La selección es conservadora: no garantiza una muestra en cada país, isla pequeña o costa estrecha. Tierra sin hielo tampoco implica vegetación presente o cobertura real de un sensor.

El producto real [NASA GISTEMP](https://data.giss.nasa.gov/gistemp/) combina información sobre tierra y océano; por eso eliminar todos los puntos oceánicos de temperatura sería una restricción equivocada. La presencia de puntos CO₂ sobre el océano en el demo no pretende reproducir órbitas, calidad de recuperación o muestreo OCO-2. Una pendiente ficticia de NDVI no demuestra deforestación.

## Perfil regional de comparación

Los detalles que siguen describen **`VITE_HEX_DEMO_PROFILE=regional`**, conservado para comparar con la presentación anterior; ya no es el perfil de inicio.

| Variable | Celdas regionales | Selección visual |
| --- | ---: | --- |
| Temperatura / Gistemp | 728 | Conserva tierra y océano, incluido el grupo del Pacífico. |
| Vegetación / ModisNdvi | 455 | Huellas continentales con margen costero; excluye por completo el grupo demostrativo de Groenlandia. |
| Reservas de agua / GraceMass | 467 | Huellas continentales y 12 interiores de Groenlandia; excluye agua oceánica abierta. |
| CO₂ / Oco2 | 728 | Conserva los ocho grupos, sobre tierra y océano. |

Las celdas aceptadas por la guarda continental se distribuyen así: Norteamérica 79, Sudamérica 83, Europa 42, norte de África 91, Asia 89, Australia 71 y Groenlandia 12. Vegetación utiliza las primeras seis regiones.

Este criterio es una decisión de diseño del escenario. No afirma que un sensor concreto observe todas esas celdas, que exista vegetación en todo terreno retenido o que una variación de NDVI equivalga a deforestación. La selección de Groenlandia en GraceMass tampoco calcula hielo ni estima masa real.

### Máscara regional y límites

El generador regional offline usa exclusivamente `frontend/public/earth/masks/modis-water-2k.png`, derivado local de **NASA EOSDIS GIBS / MODIS_Water_Mask**, 2048×1024. Su procedencia y procesamiento ya están documentados en [MASKS.md](obsidian/earth-assets/MASKS.md) y [asset-manifest.json](obsidian/earth-assets/asset-manifest.json). [NASA describe el producto de máscara de agua MODIS](https://modis.gsfc.nasa.gov/data/dataprod/mod44w.php); la capa estática GIBS utilizada aquí no se presenta como una versión anual o una clasificación nueva a esa resolución nativa. El perfil global añade Natural Earth; no extrapola este filtro regional a zonas polares sin esa referencia.

- `255` significa cobertura de agua en el píxel.
- `0` significa terreno **o ausencia de datos**. No certifica terreno válido, bioma, vegetación ni cobertura de sensor.
- Los grises proceden de reducir el canal alfa de la fuente mediante promedio BOX.
- La imagen es equirectangular: norte arriba, −180° a la izquierda y +180° a la derecha.
- SHA-256 del archivo local: `5fdaf3bae60b6c5d43218661fc2d1971136c1d9d37b06b3d6dea59608dcfb093`.

El script comprueba ocho puntos interiores conocidos repartidos entre continentes, Groenlandia y los océanos Pacífico, Atlántico e Índico. Esto detecta inversión vertical, signo incorrecto de longitud o interpretación invertida del canal. No es una validación científica global de la máscara.

### Guarda regional sobre el centro y la huella

No basta con comprobar el centro: un hexágono cuyo centro cae en tierra puede extenderse sobre el mar. El procesamiento considera el círculo circunscrito de la huella utilizada por el renderer (`0,34 × 2,2° = 0,748°` de radio) y añade un margen costero de **0,30°**, aproximadamente 33 km angulares sobre la superficie.

Para el rechazo costero se separa el agua conectada a referencias de los tres océanos del agua interior pequeña. El umbral de conexión es 128/255 y la conectividad es de cuatro vecinos. Una expansión de un píxel incorpora los bordes costeros parciales. La comprobación de la huella añade además la semidiagonal máxima de píxel, de forma que también revisa los píxeles que podrían intersectar su borde.

Se conserva una celda sólo si:

1. Su centro tiene valor de agua 0 en la máscara original.
2. El círculo de la huella y sus márgenes no intersectan agua oceánica conectada.
3. La fracción media de agua interior dentro de la guarda no supera el 8%.

La tercera condición evita descartar una región continental entera por un río pequeño, pero rechaza zonas dominadas por agua interior. El método está acotado a los ocho grupos del demo. No es una máscara de uso del suelo ni un sustituto del filtrado de calidad y cobertura que deberá devolver el backend científico.

### Reproducción de la comparación regional

```bash
python scripts/build-hex-demo-coverage.py
python scripts/build-hex-demo-coverage.py --check
node scripts/validate-hex-data.cjs
npm run type-check --workspace=frontend
```

Se utiliza Pillow, que ya emplea la preparación de texturas de Earth. No se incorpora una dependencia nueva al frontend ni se descarga ninguna imagen. El script verifica el hash contra el manifiesto local y genera `frontend/src/services/demo/hexDemoCoverage.ts`: una lista estática de identificadores y metadatos de verificación. `--check` verifica su vigencia sin escribir archivos.

El generador obtiene las regiones y separación del módulo real `hexDemoData.ts`. Una huella SHA-256 de sus 728 centros se compara con los centros generados por TypeScript en las pruebas; si cambia la geografía o la máscara, debe regenerarse la cobertura. La prueba también comprueba que el radio visual del renderer sigue dentro de la guarda documentada.

Durante la ejecución de la aplicación no se lee la imagen, no se muestrean texturas y no se recalcula cobertura por frame. Se consulta un conjunto de IDs al generar el dataset. Las coordenadas e IDs de cada variable permanecen estables entre años; sólo varían las pendientes sintéticas. Cambiar de variable puede cambiar el conjunto de celdas de manera intencional.

## Selección de perfil, carga y conexión futura

Sólo en modo `VITE_HEX_DATA_SOURCE=demo`, `VITE_HEX_DEMO_PROFILE` acepta `global` (predeterminado), `regional` (comparación) y `stress` (carga). Cambiar el entorno requiere reiniciar Vite o reconstruir la aplicación. Para regenerar o comprobar el perfil de inicio se utiliza `python scripts/build-global-hex-demo.py` o el mismo comando con `--check`.

El perfil `stress` mantiene **6.211 celdas para todas las variables**, sin filtro costero: es un ensayo de carga del renderer, no un escenario científico. Sus IDs, coordenadas y densidad no cambian con esta corrección.

No cambia `HexDataset`, el contrato API ni el backend. El modo API continúa mostrando lo que entregue el servidor, sujeto a su validación existente. **La lista geográfica del demo nunca filtra respuestas reales**. Cuando haya datos científicos, será el backend quien entregue cobertura válida y metadatos de calidad por variable; las muestras inventadas se reemplazan sin modificar la capa de dibujo.

## Validación histórica de la revisión regional

Los registros siguientes corresponden a la revisión del perfil regional y a su comparación de carga, anteriores al perfil global. Se conservan como evidencia histórica; sus conteos y FPS no se atribuyen a las 8.192 celdas globales. La validación de esa distribución se registra en [s2-global-demo.md](s2-global-demo.md).

La interfaz identifica la variable y el periodo de la tendencia. Las unidades temporales declaradas se presentan como «°C por año», «NDVI por año», etc.; no se inventa una base anual cuando falta en una respuesta API. El dato principal usa tres cifras significativas y conserva el valor recibido exacto en su título. Texto accesible explica que se trata de ritmo de cambio y no de temperatura, NDVI o concentración actuales.

Cambiar de año conserva la ubicación seleccionada y actualiza su valor. Cambiar de variable invalida la selección si esa ubicación desaparece de su cobertura: comprobado al pasar una celda del Pacífico de temperatura a vegetación. Escape cierra el selector y recupera el foco. La fuente simulada sigue visible en escritorio y móvil.

La [comprobación histórica de interfaz](validation/hex-demo-ui.json) registra las cuatro variables regionales, sus conteos, unidades y selección, con el mismo canvas. Se revisaron 1920×1080, 1440×900, 1024×768, 768×1024 y 390×844; sin superposición del instrumento de lectura y navegación. En esa revisión pasaron TypeScript, build, validadores de datos/paleta/picking y regeneración `--check`. Permanecían el aviso previo de bundle grande y los HTTP 500 del backend local ausente; no se detectaron nuevos errores de shaders.

La [medición de regresión](validation/hex-demo-benchmark.json), posterior a estos cambios, conserva 6.211 celdas frontales y sin oclusión, un canvas, seis llamadas de dibujo y las seis geometrías/texturas de la escena completa. En Edge con RTX 4060, 1920×1080 y DPR 1: reposo 165,13 FPS, hover 164,90, órbita 165,15 y zoom 165,16. Cambiar variables produjo 152,39 FPS medios, peor ventana de aproximadamente un segundo de 129 FPS y frame máximo de 36,4 ms; cambiar años produjo 162,44 FPS, peor ventana 156,66 y frame máximo 24,3 ms. Son muestras de seis segundos en Vite, no una garantía universal ni de ausencia de pausas aisladas. No hubo compilación ni validadores CPU en paralelo durante esta medición.
