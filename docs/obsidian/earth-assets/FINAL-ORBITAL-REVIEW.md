# Sistema visual terrestre — etapas A a D

22 de septiembre de 2026 · `feat/s1-t4-globe-foundation` · aprobado visualmente por Diego Arias.

Las cuatro etapas están implementadas y pasan la revisión técnica y visual local.
La composición de UI, backend, Globe, renderer, OrbitControls y StarField se conservan.
La implementación se mantuvo local hasta la aprobación de Diego, quien autorizó
su commit y PR el 22 de septiembre de 2026. El [informe anterior](STAGE-A-REVIEW.md)
se conserva como registro histórico: describía un material y una iluminación distintos.

## A — Tierra diurna

- **Fuente:** NASA Blue Marble Next Generation, Base Map, julio de 2004.
  Se conserva el compuesto oficial sin nubes ni topografía sombreada añadidas.
  [Fuentes y derivados](README.md), [comparación de candidatos NASA](CANDIDATES.md).
  Enero y septiembre no aportaban detalle en el relleno de océano profundo.
- **Agua:** GGX de Three, IOR 1.333 / F0 ≈0.0204, rugosidad 0.12 frente a 0.92
  del terreno, con máscara MODIS. Se compararon 0.18, 0.12 y 0.08 sobre el mismo
  Pacífico, sin nubes y a cámara/iluminación constantes: 0.12 acota el reflejo
  solar; 0.18 produce una mancha mayor y 0.08 un punto demasiado pequeño.
- **Color oceánico:** el relleno uniforme original de BMNG se eleva discretamente
  a reflectancia lineal `[0.003, 0.014, 0.035]`, sólo donde coincide con el color
  de relleno y la máscara de agua. Es presentación visual, no información
  oceanográfica añadida. Las variaciones costeras originales se conservan.
- **Continentes/hielo:** color natural, sin aumento global de saturación ni
  brillo emisivo. Costas y relieve glaciar periférico legibles. El interior del
  hielo sigue teniendo poca variación en la propia fuente; no se inventó detalle.
  La nieve conserva grises y transiciones, sin recorte masivo a blanco puro.
- **Relieve:** GEBCO, bumpScale 0.1 sobre radio 100; sin desplazar geometría.
- **Iluminación:** dominante solar 3.2, ambiental 0.12. La luz deja de seguir la
  cámara; conserva volumen. La noche oscura de B es intencional y diferenciada
  del antiguo problema de iluminación diurna.
- **Color:** Three 0.186.0, mapas de color/emisión en sRGB, máscara/altura/cobertura
  en NoColorSpace, salida sRGB. AgX, exposición 1.1. Se retiene la elección tras
  A/B previos NoToneMapping/AgX/ACES/Neutral y exposiciones 0.9/1/1.1/1.2.
- **Texturas:** mipmaps, LinearMipmapLinearFilter, LinearFilter, anisotropía hasta4,
  RepeatWrapping horizontal, ClampToEdge vertical. Rutas locales de Vite.
- **Vistas:** África/Europa, América del Norte y Sur, Asia, Australia, Pacífico,
  Atlántico, Groenlandia y Antártida. Primero sin nubes ni emisión nocturna.
  Para esta comparación diurna se colocó el Sol a una separación angular
  equivalente para cada región sólo en el navegador de pruebas. El runtime
  definitivo no vincula la luz a la cámara.

**Control A: superado para revisión local.** Se reconoce la geografía y la esfera
tiene volumen; agua y terreno tienen respuestas distintas. El océano profundo
uniforme de BMNG permanece una limitación documentada de la fuente, no un campo
de datos ni una textura artificial generada. El reflejo solar es visible cuando
corresponde al ángulo de observación; Diego debe revisar su intensidad.

## B — Día/noche y Black Marble

- NASA GIBS `VIIRS_Night_Lights`, Black Marble2016, sólo luces sobre transparencia.
  Se evitó el JPEG que incorpora terreno/hielo azul. [Procedencia](ORBITAL-SOURCES.md).
- Un único `Vector3 sunDirection` se comparte por identidad entre superficie,
  nubes y atmósfera; la DirectionalLight se actualiza desde ese mismo vector.
- Máscara con normal en espacio mundo: `1 - smoothstep(-0.12, 0, dot(N, S))`.
  No hay emisión sobre el horizonte. El encendido ocurre gradualmente después
  de la puesta, sin mezcla global, bloom ni continentes autoiluminados.
- Emisión1.4, conservando el color prácticamente neutro de la imagen NASA.
  Ambiental tenue deja reconocer terreno nocturno sin iluminarlo como de día.
- Referencia fija a la Tierra: el Sol avanza hacia el oeste, equivalente a la
  rotación terrestre relativa al Sol, sin mover coordenadas, selección ni UI.
  Es un **ciclo de presentación de20min**, no efemérides ni el año del timeline.
  Se limita cada paso a100ms para evitar saltos al volver de una pestaña
  suspendida. Rotación automáticaOFF y reduced-motion pausan este ciclo.
- Se reutiliza `scene.onBeforeRender`; no hay otro RAF ni objetos nuevos por
  frame. Se actualiza `key.matrixWorld` en el mismo paso. Cleanup restaura el
  callback anterior y libera los recursos propios.

**Control B: superado.** Se comprobó que orbitar con el ciclo pausado deja
exactamente iguales Sol y luz. Las tres capas comparten el mismo vector.
Una prueba acelerada a2s, sólo interceptada en el navegador de test, llevó
una región día→noche→día manteniendo alineada la luz. Producción conserva1200s.
En capturas con emisión0/1.4, el día no cambia más de2 niveles/255 en136 píxeles
de504.000; la noche cambia19.184 píxeles más de2 niveles y revela las ciudades.
Se revisaron Europa/África, América y Asia nocturna para comprobar geografía.

## C — Nubes

- NASA Blue Marble: Clouds, compuesto histórico publicado en2002, mapa de
  cobertura gris2048×1024. No representa meteorología actual.
- Esfera separada a radio100.12, con la misma geometría90×45 y orientaciónUV
  que Globe. Un muestreo de cobertura por fragmento, opacidad máxima0.78,
  iluminación por el Sol compartido. Nubes tenues de noche, claras de día.
- Sin rotación independiente ni sombras de nubes: son opciones que no se
  necesitan para este resultado. La capa permite ver continentes y costas.
- Se detectaron rayas de profundidad en tablet: `camera.near=0.05`, far125000
  y depth24 no separaban bien capas a gran distancia. `near=1` lo corrige:
  aún está muy por debajo de la separación mínima cámara/superficie de50.
  No cambia campo de visión, límites, órbita, zoom ni encuadre.
- A/B con cámara fija demostró la desaparición de rayas al pasar0.05→1.
  Se revisó además a altitudes0.5,3.6 y7.5. No se agrandó la capa para ocultarlo.

**Control C: superado.** Nubes separadas y correctamente iluminadas, sin
interpenetración o rayas visibles tras corregir precisión. A zoom extremo
son más suaves que el albedo8K, porque la fuente de nubes es2K.

## D — Atmósfera y silueta

Se sustituye la atmósfera predeterminada por un limbo propio de radio101.2.
Una malla BackSide oculta por la superficie, con respuesta angular y solar,
acentúa el borde diurno y atenúa el nocturno. Color pálido `#98b8d2`, sin
bloom, lens flare, esfera solar ni partículas adicionales. El interruptor
existente de atmósfera controla esta malla, sin recrear escena.

**Control D: superado como aproximación ligera de limbo iluminado.** No es un
modelo completo de dispersión Rayleigh/Mie ni una simulación fotométrica.

## Calidad y recursos

| Perfil | Día | Noche | Nubes | Bump / agua | Mapas RGBA8+mips aprox. |
| --- | --- | --- | --- | --- | ---: |
| Móvil inicial |2K|2K|1K|1K /1K|29,33MiB|
| Móvil, detalle opcional |4K|2K|1K|1K /1K|61,33MiB|
| Escritorio equilibrado |4K|4K|2K|2K /2K|117,33MiB|
| Escritorio detalle |8K|4K|2K|2K /2K|245,33MiB|

Móvil4K requiere acercamiento, capacidad4096 y memoria conocida≥4GiB.
Con memoria desconocida/baja conserva2K. Escritorio8K se solicita sólo al
acercarse, capacidad8192 y memoria≥8GiB si el navegador informa ese dato.
Se libera el mapa anterior al sustituirlo; puede existir un pico transitorio
de~72MiB móvil o~288MiB escritorio. No se confunde disco con memoriaGPU.
Cinco draw calls con las dos capas de estrellas;20.880 triángulos en escritorio.
No hay React por frame, otro renderer ni duplicación del material terrestre.

## Rendimiento medido

Windows, Edge Chromium, NVIDIA GeForceRTX4060, ANGLE/D3D11, DPR1. Cambios de
`renderer.info.render.frame` muestreados durante8s por tramo; calentamiento
previo y ninguna captura durante la medición. Todas las capas activas.
Resultados completos: [FINAL-ORBITAL-MEASUREMENTS.json](FINAL-ORBITAL-MEASUREMENTS.json).

| Resolución / perfil | Reposo | Órbita | Zoom | UI | Peor ventana≈1s | Peor intervalo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
|1920×1080 /4K, comprobación final|165,04|164,84|165,07|164,70|163,71|18,2ms|
|2560×1440 /8K|165,04|165,08|165,07|164,56|163,53|12,2ms|

El peor intervalo final de18,2ms durante órbita equivale a~55FPS instantáneos;
no se oculta ese salto tras el promedio. La muestra anterior1920 dio12,2ms y
también se conserva en el JSON. Se supera el objetivo de60FPS de media con
amplio margen en este equipo; no es un bloqueo garantizado de60FPS cada frame,
ni certifica otros dispositivos o DPR2. Móvil
simulado390×844/2K:165,05FPS en reposo y peor intervalo6,2ms, **sobre la misma
RTX4060, no un teléfono físico**. No se certifican batería ni memoria térmica
de un teléfono. Los datos GPU de la tabla anterior son estimaciones de mapas.

## Validaciones

- TypeScript y build pasan; permanece el aviso Vite del bundle JS>500kB.
- Lint no está operativo en el repositorio: existe script, falta ESLint.
  No se instalaron dependencias nuevas.
- Un canvas durante carga diferida de textura, aumento de detalle y resize.
  Misma instancia de Globe y material actualizados en sitio.
- Tamaños revisados:2560×1440,1920×1080,1440×900,1366×768,1024×768,
  768×1024 y390×844; capas y timeline abiertos durante interacción.
- RetículaOFF por defecto, alternancia de retícula/atmósfera verificada.
- Fallo nocturno simulado conserva día/nubes y estado `degraded`; fallo diurno
  conserva esfera `#344552` y estado `fallback`, sin reintentos infinitos.
  Restaurar peticiones y recargar recupera `ready`.
- Sin errores de shader, avisos críticos Three ni404 de assets reales.
  Los ERR_FAILED de assets fueron provocados por las pruebas. Persisten HTTP500
  anteriores de `/api/health` y `/api/trends/observations`; backend no modificado.
- Recursos acotados en las pruebas, no una certificación de fugas a largo plazo.

## Evidencia y reproducción

Los assets se reproducen con `scripts/build-earth-assets.py` y
`scripts/build-earth-orbital-assets.py`; este último se ejecutó dos veces con
hashes idénticos. URLs oficiales, resoluciones, compresión, licencias y SHA256
están en [README](README.md), [ORBITAL-SOURCES](ORBITAL-SOURCES.md) y manifiestos.

Capturas locales (no añadidas al bundle) en `output/playwright/`:

- `earth-final-before.png`: estado anterior.
- `orbital-day-*.png`: nueve orientaciones sin nubes ni luces.
- `orbital-water-*.png`: comparación de rugosidad.
- `orbital-final-desktop.png` y `orbital-full-*.png`: conjunto día/noche.
- `orbital-mobile-default.png`, `orbital-mobile-close-4k.png`: móvil.
- `orbital-depth-ab-*.png`: evidencia del defecto de profundidad y corrección.
- `orbital-delivery.png`: captura final de la entrega.

URL de revisión: http://127.0.0.1:4173/.
Diego aprobó visualmente la entrega. La [captura aprobada](validation/approved-desktop.png)
queda incluida como referencia para revisar agua, hielo, noche, luces, nubes y limbo.
La aprobación visual no altera las limitaciones técnicas documentadas arriba.

## Archivos de este pase

- Nuevo runtime: `frontend/src/components/Globe/earthEnvelope.ts`.
- Runtime modificado: `earthConfig.ts`, `earthLighting.ts`, `earthMaterial.ts`,
  `earthSurface.ts`, `useGlobeScene.ts`, `globeConfig.ts`, `globeSetup.ts`, en
  el mismo directorio de Globe. La UI previa no se editó en este pase.
- Nuevos assets: dos JPEG en `frontend/public/earth/night/` y dos PNG en
  `frontend/public/earth/clouds/`.
- Nuevo generador: `scripts/build-earth-orbital-assets.py`.
- Documentación nueva: `ORBITAL-SOURCES.md`, `orbital-manifest.json`, este
  informe y `FINAL-ORBITAL-MEASUREMENTS.json`. README y NIGHT actualizados;
  aviso histórico añadido a STAGE-A-REVIEW. Las comparaciones anteriores
  CANDIDATES y STAGE-A-MEASUREMENTS se conservan.
