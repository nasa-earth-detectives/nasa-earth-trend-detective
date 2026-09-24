# S2-T4.2 y S2-T4.3 — color y rendimiento de hexágonos

> **Archivo histórico del experimento de pendientes.** El montaje vigente utiliza observaciones anuales y se documenta en [capas de observaciones](s2-t4-observation-layers.md). Para medirlo, usar `scripts/benchmark-observation-browser.js`. El benchmark de pendientes de este documento requiere aquel montaje anterior; no debe ejecutarse esperando 6.211 instancias en la aplicación actual.

Implementación local iniciada el 22 de septiembre de 2026. Continúa [S2-T4.1](s2-t4-hex-data.md), sin cambiar backend ni fuentes de la Tierra. Los valores de la capa siguen siendo **simulados**, no observaciones NASA. El perfil de inicio actual es global; las mediciones regionales y de carga conservadas más abajo están identificadas como históricas. La validación de la distribución global se registra en [s2-global-demo.md](s2-global-demo.md).

## S2-T4.2: dirección y magnitud

`frontend/src/config/hexPalette.ts` centraliza una escala divergente: azul frío `#5b8eb9` para pendientes negativas, mineral `#aaa99d` para cero y rojo ladrillo `#bf6557` para positivas. La leyenda muestra unidad, límites numéricos y dirección escrita; no depende únicamente del color. Selección y hover aclaran el color propio de la celda sin convertir todos los estados al acento de la variable.

El dominio es `[-heightDomain, +heightDomain]`, fijo para la variable/unidad. No se renormaliza al año ni al máximo del dataset. Fuera del dominio, color y altura se limitan, pero el instrumento conserva la cifra original y avisa de la limitación. El signo expresa incremento/descenso: no implica significancia estadística, causa física ni que una variación sea buena o mala.

Las pendientes no nulas menores de 0,0001 se muestran en notación científica, evitando que un descenso/incremento parezca cero por redondeo. Lo mismo se aplica a dominios muy pequeños.

La interpolación de la leyenda CSS y la de Three coinciden en sRGB. Los colores finales se entregan a Three en espacio lineal. Las caras tienen sombreado geométrico suave para leer el volumen, no iluminación física de la superficie terrestre. La Tierra conserva sus materiales y colores naturales.

El selector accesible muestra 100 celdas por página, con un máximo de 102 opciones contando marcador y selección de otra página. Hay controles de anterior/siguiente, estado deshabilitado y foco visible. En teléfono se reserva espacio para coordenadas/valor y se simplifica el instrumento durante la exploración temporal, manteniendo escala y aviso de simulación.

## S2-T4.3: render y selección

- Una `InstancedMesh`, una geometría y un material para todas las columnas; una llamada de dibujo añadida.
- Geografía, matrices base y alturas conservadas incluso durante el estado de carga entre periodos. Las consultas crean registros independientes de la caché geográfica del demo.
- Durante la transición de altura sólo se actualizan los componentes de altura y posición radial. Se reutilizan buffers; no se crean matrices por celda y frame.
- Hover/selección actualizan únicamente los tres componentes de color de las celdas afectadas.
- Un índice BVH de cajas geográficas limita las pruebas exactas de intersección a candidatas. Sus límites incluyen la altura máxima, por lo que no se reconstruye con cada año. Conserva la oclusión por la esfera y las transformaciones del globo.
- La animación se integra en el bucle existente. No se añade renderer, canvas, runtime Three ni actualizaciones React por frame. Se respeta movimiento reducido y se dispone la geometría/material al desmontar.

La revisión histórica del benchmark nativo de selección comparó 1.115 rayos con el raycast estándar de Three: resultados equivalentes, incluyendo huecos, reverso, limbo, cámara cercana y transformación de entrada. En esa ejecución, la consulta frontal pasó de **0,465 a 0,0226 ms** y la cercana de **0,669 a 0,0265 ms**. Es latencia CPU de una prueba Node, no FPS ni una medición de las 8.192 celdas globales. La escena anterior ya superaba 60 FPS en este equipo; no se atribuye una recuperación inexistente a esta optimización.

## Perfiles demostrativos

`VITE_HEX_DEMO_PROFILE=global` es el valor predeterminado: 8.192 centros Fibonacci repartidos por la esfera. Temperatura y CO₂ usan todos; vegetación utiliza 1.458 huellas continentales sin hielo cartografiado y agua/hielo 1.662 huellas continentales. El [escenario global](s2-global-demo.md) explica las fuentes, la guarda costera y la exclusión de hielo. Su distribución no garantiza una celda en cada isla o país pequeño y no representa cobertura de un satélite.

`VITE_HEX_DEMO_PROFILE=regional` conserva la comparación anterior: ocho grupos con hasta 728 celdas; vegetación usa 455 y agua/hielo 467. Véase [cobertura del demo](s2-demo-coverage.md). `VITE_HEX_DEMO_PROFILE=stress` activa 6.211 celdas a 0,75° alrededor de 18° N, 12° O para todas las variables: es exclusivamente un ensayo de carga, no una simulación de cobertura válida. Reiniciar Vite o reconstruir tras cambiar el entorno. Sólo afecta a `VITE_HEX_DATA_SOURCE=demo`.

El ensayo denso limita la magnitud ficticia al 30% del dominio para evitar que las columnas delanteras oculten las traseras; **no es una reducción del número de celdas dibujadas**. En la validación histórica se verificaron 6.211 tapas con línea de visión libre y todas dentro del encuadre. Esta cifra no se aplica a las 8.192 celdas globales: en ese perfil una parte está al otro lado del planeta, fuera del encuadre o excluida por la variable. `global` es la experiencia normal; `regional` y `stress` se conservan como comparaciones.

## Reproducir las comprobaciones

Desde la raíz, con dependencias instaladas:

```powershell
node scripts/validate-hex-data.cjs
node scripts/validate-hex-palette.cjs
node scripts/validate-hex-picking.cjs
python scripts/build-global-hex-demo.py --check
npm run type-check --workspace=frontend
npm run build --workspace=frontend
```

Para medir navegador, iniciar Vite en una terminal y después abrir una sesión visible de Playwright CLI en otra:

```powershell
npm run dev --workspace=frontend -- --host 127.0.0.1 --port 4173
```

```powershell
npx --yes --package @playwright/cli playwright-cli --session hexs2 open http://127.0.0.1:4173/ --headed
$hexBenchmark = Get-Content scripts/benchmark-hex-browser.js -Raw
playwright-cli --session hexs2 run-code "$hexBenchmark"
```

El último comando presupone `playwright-cli` disponible en PATH. También puede ejecutarse su archivo `playwright-cli.js` con `node`; se utilizó esta vía en Windows para conservar correctamente el argumento multilínea. No se requiere añadir Playwright a las dependencias del producto.

El guion instrumenta únicamente esa sesión de Vite mediante interceptación de respuestas para elegir `stress` y obtener una referencia temporal a Globe. El código del producto no contiene globals de depuración. Recargar al terminar devuelve la página al perfil configurado. No se utiliza con el build compilado.

Cada caso dura seis segundos y cuenta frames nuevos del renderer. Se reinicia la cámara y comprueba más de 5.000 celdas frontales antes y después de cada muestra. El ensayo de tapas sin oclusión ocurre **fuera** de la medición FPS. La peor ventana representa aproximadamente un segundo; el frame más largo se informa por separado, porque el promedio puede ocultar pausas breves.

## Validación histórica del perfil de carga

Los resultados siguientes corresponden al ensayo `stress` anterior a la adopción del perfil global. Se conservan sin reinterpretarlos como mediciones del nuevo conjunto de 8.192 centros. La revisión global y sus límites se registran en [s2-global-demo.md](s2-global-demo.md).

Resultados históricos completos: [hex-benchmark.json](validation/hex-benchmark.json). Equipo: Edge, NVIDIA GeForce RTX 4060, 1920×1080, DPR 1, Vite en desarrollo, escenario de 6.211 celdas con la Tierra existente, nubes y atmósfera activas. No hubo build ni otras pruebas CPU en paralelo durante esa medición.

| Caso | FPS medio | Peor ventana de ~1 s | Frame más largo |
| --- | ---: | ---: | ---: |
| Rotación en reposo | 165,17 | 164,98 | 6,6 ms |
| Hover | 164,91 | 164,47 | 12,0 ms |
| Órbita | 165,10 | 164,99 | 6,2 ms |
| Zoom | 165,07 | 164,98 | 6,5 ms |
| Cambios de variable | 149,74 | 114,31 | 42,5 ms |
| Cambios de año | 162,76 | 157,98 | 18,2 ms |

La navegación satisface el objetivo de fluidez en este equipo con más de 5.000 celdas visibles. Cambiar de variable sigue provocando trabajo puntual del frontend (respuesta, buffers y actualización del instrumento): un frame de 42,5 ms no cumple el presupuesto de 16,7 ms, aunque las ventanas de un segundo superan 60 FPS. No se oculta este límite ni se afirma fluidez universal. La caché evita reproyectar la geografía, pero no elimina todo el coste de sustituir el contexto.

La escena conserva seis llamadas de dibujo, 169.944 triángulos, seis geometrías y seis texturas. Se verificó el mismo nodo canvas durante variables, fechas, órbita y zoom. La prueba es corta y de un solo equipo: no garantiza 60 FPS en todo hardware ni ausencia de frames aislados por encima de 16,7 ms.

TypeScript, build y los tres validadores pasan. El build conserva el aviso del bundle principal mayor de 500 kB; no se agregaron dependencias. No se ejecutó lint porque ESLint no está instalado. No se observaron errores de shader ni avisos Three nuevos. Persisten los HTTP 500 del proxy de salud/observaciones porque el backend local no está disponible; la capa demo no depende de él.

Revisión de escritorio 1920×1080 y 1440×900, portátil 1024×768, tableta 768×1024 y teléfono 390×844. Comprobados escala, selección, páginas de celdas, fuente simulada, cambio de variable/fecha, separación de controles y lectura temporal. La prueba de 6.211 celdas creó sólo 102 opciones DOM al conservar una selección en otra página. Un viewport móvil no equivale a una medición en una GPU de teléfono real.

Capturas y registros locales en `output/playwright/hex-*`, excluidos de Git. Sin modificaciones de backend, commit, push ni PR.
