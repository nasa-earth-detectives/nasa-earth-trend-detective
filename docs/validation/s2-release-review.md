# Revisión de entrega S2-T4

22 de septiembre de 2026, hora de Colombia. Rama `feat/s1-t4-globe-foundation`; destino del PR: `development`. Incluye las capas anuales, la sincronización solar UTC y las correcciones de lectura acumuladas localmente.

## Contraste térmico y composición

- Azul `#267edf` y rojo `#e44f46`, con contraste simétrico `abs(anomaly / 2) ** 0.65`. Referencia cero neutra; dominio, alturas y lecturas sin cambios. La misma función alimenta prismas, mapa de calor y leyenda.
- La leyenda indica «Respecto al promedio de referencia»; el inspector distingue temperatura absoluta y anomalía. Los datos demo y su referencia continúan identificados como ficticios.
- El modo temporal conserva escala y procedencia en una lectura compacta; al cerrarlo reaparecen cantidad y controles. Sin solapamiento con el año ni con navegación en 1440×900, 1366×768, 768×1024 y 390×844. Sin scrollbar interno en el estado listo; los errores largos conservan desplazamiento.
- El renderer de columnas se separó en coordinación, estado, animación y actualización de buffers. Se conservan las API, una `InstancedMesh`, selección BVH y transiciones de 800 ms. Cada módulo de código nuevo/modificado queda por debajo de 200 líneas; la fixture geográfica conserva los mismos 467 ID.

## Comprobaciones

- `npm run type-check --workspace=frontend`: pasa.
- `npm run build --workspace=frontend`: pasa; persiste el aviso de chunk principal superior a 500 kB (2.316,50 kB; 664,81 kB gzip). Worker separado: 47,77 kB. Sin nuevas dependencias.
- Pasan validadores de observaciones, búsqueda regional, hexágonos, raster, selección, datos, paleta, posición solar y ciclo de vida de iluminación. Cubren signo/contraste, cero, unidades, límites, contratos API, cancelación, consistencia inspector/celda, 800 ms, buffers reutilizados y liberación.
- Generadores geográficos regional/global con `--check`: datos reproducidos sin cambios semánticos. Se separaron auxiliares de los validadores y del generador global para cumplir la modularidad del repositorio.
- Lint no se declara aprobado: el script del proyecto requiere ESLint, ausente de sus dependencias instaladas.
- Navegador Edge: cuatro variables, dos capas, año, órbita, zoom, leyenda e inspector; un canvas conservado. Sin errores de consola/shader observados. Instrumentación de pruebas retirada al terminar.
- Sin cambios de backend. La fuente API queda preparada, pero los datos actuales no son observaciones NASA ni resultados Mann–Kendall/Sen.

## Rendimiento de esta entrega

[Medición de escritorio](s2-release-performance.json), reproducible con `scripts/benchmark-observation-browser.js`; [viewport móvil](s2-release-mobile.json), con `scripts/benchmark-observation-mobile.js`. Se ejecutan mediante Playwright CLI contra Vite. No hubo build simultáneo durante las mediciones. Se cuentan frames nuevos del renderer por rAF; no son tiempos GPU.

Equipo: Edge, NVIDIA GeForce RTX 4060, ANGLE Direct3D11, DPR 1. Escritorio: 1920×1080, ventanas de seis segundos, 1.662 muestras iniciales. Hexágonos: 156,2–165,1 FPS medios; mapa de calor: 153,6–165,2. Peor ventana de aproximadamente un segundo: 145 FPS en hexágonos y 143 en calor. Frame aislado más lento: 42,5 ms al cambiar variable; **no equivale a 60 FPS garantizados en cada fotograma**.

Viewport 390×844 sobre esa misma GPU de escritorio: perfil terrestre `mobile`; 165,2 FPS en reposo, 164,9 en órbita y 163,1 cambiando el año. Peor ventana: 158,6 FPS; frame más lento: 24,2 ms. Cinco ciclos completos calor→hexágonos mantuvieron 7 geometrías/8 texturas, seis llamadas de dibujo y el mismo canvas. Es una comprobación breve de reutilización, no una certificación prolongada de ausencia de fugas.

## Pendiente de S2-T4.3

El objetivo literal incluye teléfonos físicos y degradación de densidad hexagonal en equipos de baja potencia. Esta entrega no certifica esos dos puntos: la prueba móvil es emulación de tamaño en PC y los perfiles existentes reducen texturas/pixel ratio, no la densidad analítica. S2-T4.1 y S2-T4.2 tienen evidencia funcional; S2-T4.3 queda en pruebas hasta cubrir ese alcance. No se cerrarán tareas de otros responsables.
