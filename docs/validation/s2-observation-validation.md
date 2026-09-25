# Validación local S2-T4 — observaciones

22 de septiembre de 2026, Colombia. Rama `feat/s1-t4-globe-foundation`. Sin commit, push o PR. Sin modificaciones del backend ni del material terrestre en este pase.

## Comprobaciones

- TypeScript y build de producción: pasan. El chunk principal conserva la advertencia de más de 500 kB (2.314,19 kB; 664,22 kB gzip). Worker separado: 47,72 kB. Sin dependencias nuevas.
- Lint: el script existe pero ESLint no está instalado como dependencia del frontend; no puede ejecutarse. No se declara aprobado.
- Pasan `validate-observation-data.cjs`, `validate-earth-hex.cjs`, `validate-earth-heat.cjs` y `validate-observation-lookup.cjs`: semántica anual, signo, unidades, cobertura, selección, 800 ms, raíz compartida, liberación, respuestas tardías, antimeridiano y polos.
- Edge: cuatro variables, hexágonos/calor/sin capa y reproducción temporal (2010→2012). Sin capa deja ambos objetos ocultos. Tierra: 1.662 muestras; océanos opcionales: 8.192. NDVI: 1.458 muestras terrestres.
- Clic real de ratón sobre prisma: inspector en `17.996564091231978, -13.027738392876927`, coordenadas exactas de la observación. Cambiar año conserva selección por ID sin reabrir inspector.
- Selector accesible paginado, Escape, cierre al seleccionar o salir. Ya no obstruye Recentrar después de cerrar el inspector.
- Pacífico sin cobertura NDVI: sin serie. Muestra terrestre cercana: identifica coordenadas y distancia, diferenciándola del punto libre.
- API interceptada sólo en navegador de prueba: `value=12.5`, `anomaly=1.2` muestra `1,20 °C`, sin historia inventada. Unidad `kg` rechazada: cero instancias y sin sustitución demo. Interceptaciones retiradas; configuración real sigue demo.
- Vistas: 1920×1080, 1440×900, 1366×768, 768×1024 y 390×844. Documento sin desbordamiento horizontal en 390/768/1366; un canvas. Móvil es emulación de tamaño en PC, no prueba de GPU de teléfono.
- Consola final: cero errores y cero advertencias; sin errores de shader. Capturas locales `output/playwright/observation-*.png`, fuera de Git.

## Rendimiento

[JSON completo](s2-observation-performance.json). Script reproducible: `scripts/benchmark-observation-browser.js`, ejecutado mediante `playwright-cli run-code` sobre Vite. Instrumentación temporal retirada después de validar. Ventanas de seis segundos: se cuentan intervalos rAF en los que avanzó `renderer.info.render.frame`.

NVIDIA GeForce RTX 4060, ANGLE Direct3D11, Edge, 1920×1080, DPR 1. Calidad terrestre automática del proyecto. 1.662 observaciones, 1.458 al cambiar a NDVI. No se presupone este resultado en otros equipos ni en la cobertura opcional de 8.192.

| Capa | Escenario | FPS promedio | Peor ventana de ~1 s | Frame más lento |
| --- | --- | ---: | ---: | ---: |
| Hexágonos | Reposo | 165,1 | 165,0 | 6,4 ms |
| Hexágonos | Órbita | 165,0 | 164,0 | 12,0 ms |
| Hexágonos | Zoom | 165,1 | 165,0 | 6,3 ms |
| Hexágonos | Variable | 155,8 | 146,0 | 42,4 ms |
| Hexágonos | Año | 162,4 | 155,6 | 24,2 ms |
| Calor | Reposo | 164,9 | 164,0 | 12,1 ms |
| Calor | Órbita | 165,1 | 165,0 | 6,5 ms |
| Calor | Zoom | 165,0 | 165,0 | 6,3 ms |
| Calor | Variable | 152,3 | 139,2 | 48,4 ms |
| Calor | Año | 162,7 | 159,5 | 24,2 ms |

Las medias superan 60 FPS; los picos de transición de 42–48 ms impiden afirmar 60 FPS constantes en cada frame. No se atribuye el pico a un subsistema sin perfilador CPU/GPU. El raster se calcula en Worker y descarta respuestas antiguas.

Seis llamadas de dibujo; mismo canvas entre cambios, un Worker. Recursos: hexágonos 6 geometrías/6 texturas; calor 7/8, estables en escenarios posteriores. Comprueba reutilización en esta prueba, no sustituye una prueba prolongada de fugas.

## Límites

Datos ficticios, no observaciones NASA. La máscara describe tierra/hielo de referencia; no simula biomas, hielo estacional ni cobertura real de sensores. El suavizado puede extenderse sobre costas. Las escalas limitan color/altura, nunca el valor numérico recibido. Un prisma por observación: no se promete teselación H3 ni agregados nacionales.
