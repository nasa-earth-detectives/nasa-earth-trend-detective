# Superficie terrestre NASA — Phase 2

Volver al [[00-Map-Of-Content]] · Experiencia: [[11-Experiencia-Observacion-Espacial]]
· Revisión del material: [[13-Rescate-Realismo-Diurno]]

## Alcance

Base Earth reconocible con Blue Marble: Next Generation, julio de 2004, sin
nubes añadidas. La imagen no cambia con el año ni la variable seleccionados.
No es una representación de datos científicos del timeline.

La UI, StarField, cámara, controles y canvas se conservan. La retícula pasa a
OFF por defecto; su interruptor existente actúa sobre el mismo globo.

## Arquitectura

- `earthConfig.ts`: rutas locales por perfil y parámetros de material/luces.
- `earthSurface.ts`: carga, instalación del material propio y cleanup.
- `earthMaterial.ts`: GGX, respuesta de agua/terreno y corrección del relleno oceánico.
- `earthLighting.ts`: luz diurna de presentación relativa a cámara; no solar.
- `useGlobeScene.ts`: crea el controlador una vez y lo libera al desmontar.
- `GlobeViewer.tsx`: sólo añade un aviso de fallback/detalle parcial si falla
  un archivo. El setter estable no provoca remontajes al cambiar de estado.

Vite usa su `publicDir` predeterminado relativo al workspace frontend. La ruta
canónica es `frontend/public/earth/`; el `/public` de la raíz no contiene los
assets nuevos. Las imágenes se copian a `dist/earth` y no entran al JavaScript.

Procedencia, originales, resoluciones, bytes, hashes, créditos y reproducción:
[documentación de assets](earth-assets/README.md).

## Lifecycle y recursos

Se instala un material Standard sobre la geometría existente. Los mapas lo
actualizan sin volver a crearlo ni llamar a `globeImageUrl()`.
El controlador evita que respuestas tardías modifiquen una escena desmontada;
desvincula y dispone sus texturas antes del destructor de Globe.

Hay tres texturas de superficie: color, bump y máscara de agua. Desktop usa
4K+2K+2K; móvil/tableta, 2K+1K+1K. Decisión inicial, sin recargas al cambiar
modo o viewport. Estimación RGBA8+mipmaps: 64 MiB y 16 MiB, respectivamente.
No son cifras de memoria total ni equivalen a los JPEG/PNG comprimidos.
Three r186 añade una LUT DFG interna para el material físico.
El rescate diurno añade una mejora opcional a 8K al acercarse en escritorio
compatible; eleva los mapas a aproximadamente 192 MiB y libera el 4K previo.
No se solicita 8K al iniciar ni en el perfil móvil/táctil.

La órbita inicial 18° N, 12° O muestra África, Europa y parte de América.
Rotación automática 0,12; atmósfera nativa azul pálido `#94aec8`, altura 0,045.
El relieve usa bump 0,065 sin desplazar vértices; no se añaden montañas geométricas.

## Validación local

TypeScript estricto y build de Vite. Edge headless en 2560×1440, 1920×1080,
1440×900, 1366×768, 1024×768, 768×1024 y 390×844; perfiles de carga y fallos
controlados, órbitas cerca/lejos, polos y meridiano 180°. Los scripts de QA en
`output/playwright/earth-*.cjs` no exponen globals en producción; la prueba de
órbitas instrumenta exclusivamente la respuesta del módulo en su navegador.

La inspección funcional no garantiza 60 FPS ni sustituye pruebas en GPU móvil
física. Persisten errores HTTP 500 de la API local desconectada, independientes
de las texturas locales. Los fallos de imágenes provocados en QA son esperados.

## Fase siguiente

Dirección solar, mezcla day/night y terminador, Black Marble en el lado nocturno,
luces urbanas y atmósfera dependiente de iluminación. `night` está reservado
pero no contiene texturas descargadas. No hay nubes ni overlays de datos.
