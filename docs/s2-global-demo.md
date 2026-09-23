> **Referencia histórica:** este documento describe el demo de pendientes anterior, no el montaje actual. Sus fuentes geográficas se reutilizan. La presentación vigente está en [S2-T4 — capas de observaciones](s2-t4-observation-layers.md).

# Escenario demostrativo global de tendencias

El benchmark `scripts/benchmark-global-hex-browser.js` pertenece a este montaje histórico de pendientes. Para reproducir la aplicación actual, usar `scripts/benchmark-observation-browser.js`: comienza con 1.662 observaciones continentales, no con 8.192 columnas globales.

El perfil global reparte **8.192 centros fijos** por toda la esfera mediante una distribución Fibonacci aproximadamente uniforme. Sustituye la apariencia de grupos regionales aislados. Los valores de tendencia siguen siendo inventados; las fuentes geográficas utilizadas aquí sólo evitan mostrar columnas continentales sobre agua o vegetación sobre hielo cartografiado.

## Contrato de cobertura

`frontend/src/services/demo/hexGlobalCoverage.ts` exporta:

- `HEX_GLOBAL_COVERAGE`: cantidad de centros, separación nominal, ángulo áureo, recuentos, parámetros de guarda y hashes de fuentes/resultados.
- `HEX_GLOBAL_FLAGS`: cadena de **8.192 caracteres**, indexada exactamente igual que los centros. No contiene valores de temperatura, vegetación, masa de agua ni CO₂.

Para `i` entre 0 y 8.191:

```ts
const latitude = Math.asin(1 - 2 * (i + 0.5) / 8192) * 180 / Math.PI;
const longitude = ((i * 137.50776405003785 + 180) % 360) - 180;
```

| Carácter | Significado | Celdas |
| --- | --- | ---: |
| `0` | Agua o huella rechazada por la guarda continental. No significa ausencia de observación para temperatura o CO₂. | 6.530 |
| `1` | Huella continental válida que intersecta superficie glaciada cartografiada; queda fuera del escenario de vegetación. | 204 |
| `3` | Huella continental válida sin superficie glaciada cartografiada dentro de su guarda. | 1.458 |

El bit inferior identifica las **1.662 huellas continentales**; el segundo bit identifica las **1.458 sin hielo cartografiado**. Temperatura y CO₂ pueden utilizar los 8.192 centros, incluidos océanos. El escenario continental de reservas de agua utiliza las 1.662 huellas aceptadas. Vegetación utiliza las 1.458 del carácter `3`.

**Tierra sin hielo no equivale a vegetación presente.** Este filtro no clasifica biomas, productividad, cobertura real de un sensor o deforestación. Puede incluir desiertos y suelo desnudo; representa el lugar donde el demo permite consultar una variable terrestre, no una afirmación científica sobre ese lugar. Tampoco calcula hielo estacional o cambios históricos de costa/glaciares.

## Fuentes geográficas y trazabilidad

1. **NASA EOSDIS GIBS / MODIS_Water_Mask**: se reutiliza el derivado local `frontend/public/earth/masks/modis-water-2k.png`, 2048×1024, canal gris. `255` indica agua; `0` indica terreno **o ausencia de datos**. La procedencia, URL WMS y procesamiento BOX del canal alfa están en [MASKS.md](obsidian/earth-assets/MASKS.md). Este mapa sirve como referencia visual estática; no se afirma una versión anual nueva del producto MODIS.
2. **Natural Earth, Land, escala 1:50 millones**: [GeoJSON del repositorio mantenido por el proyecto](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson). Sus polígonos impiden confundir ausencia de datos MODIS con tierra, especialmente sobre océanos polares.
3. **Natural Earth, Glaciated Areas, escala 1:50 millones**: [GeoJSON del repositorio mantenido por el proyecto](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_glaciated_areas.geojson). Se utiliza para excluir huellas sobre las superficies glaciadas cartografiadas de la selección de vegetación.

Natural Earth publica estos datos como [dominio público](https://www.naturalearthdata.com/about/terms-of-use/). No son productos NASA ni observaciones actuales. Los archivos originales se conservan en `output/earth-source`, fuera de los assets servidos y del JavaScript del navegador.

| Archivo de referencia | SHA-256 fijado |
| --- | --- |
| `modis-water-2k.png` | `5fdaf3bae60b6c5d43218661fc2d1971136c1d9d37b06b3d6dea59608dcfb093` |
| `ne_50m_land.geojson` | `e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b` |
| `ne_50m_glaciated_areas.geojson` | `c7a097b4b8e0d360dc82c90ab20c34b78aa5939a5ec8ab157c18945938e9c0a7` |

Los enlaces de descarga de Natural Earth apuntan a `master`, pero el generador exige estos hashes exactos. Si una fuente cambia, se detiene para revisión en lugar de reemplazarla silenciosamente.

## Procesamiento offline

Los polígonos Natural Earth se rasterizan a 2048×1024 con Pillow, respetando polígonos múltiples, huecos y unión entre elementos. La rasterización conserva norte arriba y longitudes −180°…+180°. Las geometrías de origen ya están divididas en el antimeridiano; el generador rechaza una fuente nueva que cruce ese borde sin división.

Se combina el exterior de tierra Natural Earth con el agua oceánica conectada de la máscara NASA. Esto añade una referencia cartográfica independiente donde el cero de MODIS podría significar ausencia de datos. El helper de agua conectada evita convertir cualquier río pequeño en una costa oceánica.

La guarda de cada columna revisa:

1. Centro dentro de tierra Natural Earth y sin agua indicada por MODIS.
2. Círculo circunscrito conservador usado para generar cobertura: radio `0,34 × 2,2° = 0,748°`. La huella visual actual se redujo a `0,25 × 2,2° = 0,55°`; conservar la guarda mayor evita regenerar cobertura y deja margen adicional respecto a la costa. La altura máxima visual es de `0,03 × radio de la Tierra`, independiente de esta clasificación geográfica.
3. Margen costero de **0,20°**, unos 22 km angulares, más la semidiagonal máxima de un píxel. Se comprueba cada píxel que puede intersectar ese círculo ampliado.
4. Ausencia de océano o exterior terrestre dentro de la guarda.
5. Fracción media de agua interior no mayor al 8%, para conservar continentes atravesados por ríos pequeños sin aceptar huellas dominadas por lagos.
6. Intersección de la misma huella ampliada con hielo Natural Earth para distinguir `1` de `3`.

Las comprobaciones usan distancia angular esférica, envuelven la longitud en ±180° y revisan todas las longitudes cuando la guarda cruza un polo. La separación de 2,2° es nominal: estos centros Fibonacci no representan la resolución de un sensor ni una malla hexagonal científica de área exacta.

La selección es deliberadamente conservadora. Islas pequeñas, costas estrechas, fiordos y zonas próximas a hielo pueden quedar sin columnas continentales; no se inventa cobertura para rellenar esos huecos.

## Reproducción y validación

```bash
python scripts/build-global-hex-demo.py
python scripts/build-global-hex-demo.py --check
```

Se utiliza Python y Pillow, ya empleados en la preparación de texturas Earth; no se instala ninguna dependencia nueva. Si faltan los dos GeoJSON, el generador los descarga a la caché y valida los hashes antes de guardarlos. La máscara NASA local se verifica, no se modifica. `--check` vuelve a calcular la cobertura y comprueba el archivo generado sin reescribirlo.

La validación incorporada comprueba doce referencias: Amazonia, Sahara, Australia, India, interior de Groenlandia, interior antártico, océano Ártico, Pacífico, Atlántico, Índico y ambos lados del antimeridiano del Pacífico. Se valida tanto la rasterización tierra/hielo como el resultado de la guarda de huella.

El hash de geometría usa líneas `i,latitude.toFixed(8),longitude.toFixed(8)` unidas con salto de línea, sin salto final. Coincide entre el generador Python y la fórmula JavaScript indicada arriba:

- Geometría: `a224216c8d2db393f5235691d295d8d4099df83ce12c006b3675c2e4b8c6ec8f`.
- Cadena de flags: `047664ce86b8038138116d4dc2b00287821d11e8944a9af35e0971755ff6c804`.

## Coste y datos reales

El navegador recibe una cadena de 8.192 caracteres y metadatos pequeños. No carga los GeoJSON ni imágenes de cobertura para este filtro, no rasteriza polígonos y no calcula cobertura por frame. Los flags son estables entre años y variables; cada variable utiliza la selección correspondiente.

El perfil de estrés de 6.211 columnas sigue siendo una prueba independiente de carga. No debe confundirse con la distribución global de producción del demo.

Estas referencias no filtran la API real. Cuando el backend entregue tendencias científicas, deberá aportar coordenadas, unidades, cobertura válida y calidad de observación. La capa de dibujo conserva su contrato; se sustituye la fuente sintética sin presentar estos flags como cobertura NASA.

## Presentación y comprobación local — 22 de septiembre de 2026

El perfil predeterminado es `global`; `VITE_HEX_DEMO_PROFILE=regional` conserva el escenario anterior y `stress` conserva una prueba concentrada de carga. Los tres están separados de `VITE_HEX_DATA_SOURCE=api`. Las pendientes globales forman un campo sintético suave sobre coordenadas esféricas: no hay corte en ±180°, cambian de forma determinista con variable y periodo y no pretenden representar patrones observados del clima.

Las columnas utilizan una sola `InstancedMesh` y una llamada de dibujo adicional. Su altura sigue siendo proporcional a la magnitud absoluta, con dominio fijo por variable. El brillo del material pasa de 0,55 a 0,94 según distancia (interpolación suave entre altitudes 2,6 y 0,65), sin cambiar datos, color por instancia, matrices ni selección al hacer zoom. El material permanece opaco para evitar errores de orden entre miles de transparencias. Las alturas menores y la huella de 0,25 dejan leer mejor la geografía.

Validaciones ejecutadas:

- Generador `--check`, contrato de datos, paleta y selección: correctos. Se contrastaron 1.695 rayos con la geometría nativa, de los cuales 580 usan la distribución global. La guarda costera cubre la huella real del renderer.
- TypeScript y build: correctos. Vite conserva el aviso de bundle JavaScript superior a 500 kB; no se añadieron dependencias.
- Navegador Edge: escritorio 1920×1080, portátil 1366×768, tablet 768×1024 y móvil 390×844; selección por teclado, paginación con 101 opciones, cambio de variable/año, giro y zoom. Un solo canvas, misma referencia antes y después de las interacciones.
- Capturas locales de África/Europa, América, Asia/Australia, Pacífico, Ártico, zoom cercano y vegetación sin columnas sobre Groenlandia. Los hexágonos analíticos siguen siendo legibles en el lado nocturno; no son parte del material terrestre.
- Consola: sin errores observados de shader o WebGL. Las consultas existentes a `/api/health` y `/api/trends/observations` responden HTTP 500 en este entorno sin backend disponible; son independientes de la fuente demo de hexágonos y no se ocultaron.
- En móvil se separó el selector de celda de la unidad de la leyenda. En Vista se corrigió el desbordamiento horizontal del panel.

### Medición de rendimiento

Resultado completo: [s2-global-performance.json](validation/s2-global-performance.json). Reproducción: ejecutar el contenido de `scripts/benchmark-global-hex-browser.js` mediante `playwright-cli run-code` con el servidor Vite abierto. Sólo la sesión de prueba expone una referencia temporal a Globe; no hay instrumentación de prueba en producción.

Edge, NVIDIA GeForce RTX 4060, ANGLE D3D11, 1920×1080, pixel ratio 1; seis segundos por modo, texturas ya cargadas y sin build concurrente. Se cuentan intervalos de `requestAnimationFrame` en los que cambia el contador de frames del renderer; no es una medición de tiempos GPU ni certifica todos los equipos. Las 8.192 columnas se distribuyen por toda la esfera y no están todas simultáneamente a la vista.

| Interacción | FPS medios | Peor ventana de ~1 s | Fotograma más largo |
| --- | ---: | ---: | ---: |
| Reposo | 165,0 | 165,0 | 6,2 ms |
| Puntero sobre la capa | 164,9 | 164,2 | 12,3 ms |
| Giro | 165,1 | 165,0 | 6,4 ms |
| Zoom | 165,1 | 165,0 | 6,3 ms |
| Cuatro cambios de variable | 149,7 | 123,0 | 66,7 ms |
| Cuatro cambios de año | 161,8 | 150,8 | 24,2 ms |

La navegación sostiene el objetivo de 60 FPS en este equipo; cambiar rápidamente entre coberturas produce un pico de 66,7 ms, por lo que no se afirma 60 FPS en cada fotograma. La escena terminó con seis llamadas de dibujo, seis geometrías, seis texturas, 217.488 triángulos y el mismo canvas. La prueba móvil usa viewport de escritorio reducido: no mide una GPU de teléfono físico.

### Estados visuales de la escena

Los rótulos «Pronto» de nubes, luces nocturnas y terminador estaban desactualizados respecto al motor existente. Ahora aparecen como «Integrado» bajo «Sistema visual integrado». Esto indica que existe la capacidad; no es un indicador en vivo de carga de texturas ni un nuevo interruptor. Las capas científicas todavía pendientes siguen identificadas como tales. No se rediseñó la interfaz ni se alteró el sistema terrestre.
