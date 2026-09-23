# Sistema visual terrestre — control de etapa A

> Informe histórico del primer pase, anterior a la continuación solicitada por Diego.
> El estado vigente, las correcciones posteriores y las etapas B/C/D están en
> [FINAL-ORBITAL-REVIEW.md](FINAL-ORBITAL-REVIEW.md). Se conserva esta evaluación
> original para mantener la trazabilidad de la decisión y las comparaciones.

Fecha: 22 de septiembre de 2026. Rama: `feat/s1-t4-globe-foundation`.

**Etapa A NO aprobada visualmente. Etapas B, C y D no iniciadas.**
El rendimiento supera el objetivo en el escritorio probado, pero eso no equivale
a aprobar la apariencia. El Pacífico aún parece demasiado uniforme y el reflejo
se percibe plástico. El hielo central tiene poca variación perceptible. No se
añaden luces nocturnas, nubes ni dispersión avanzada para ocultar estos problemas.

## Auditoría y cambios acotados

- NASA Blue Marble Next Generation Base Map de julio de 2004 sigue siendo la
  base. No contiene una capa global de nubes ni relieve sombreado añadido.
  No es un albedo PBR radiométrico puro. Procedencia y hashes: [README](README.md)
  y [manifiesto](asset-manifest.json).
- Material `MeshStandardMaterial` de Three 0.186.0, GGX, metalness 0, rugosidad
  terrestre 0.92 y reflectancia del agua F0 calculada desde IOR 1.333 (~0.0204).
  Se compararon rugosidades oceánicas 0.54, 0.38 y 0.28. Se conserva 0.38:
  acota la mancha ancha inicial; 0.28 concentra demasiado el brillo. **Este
  ajuste no resuelve por sí solo la percepción plástica.**
- La máscara MODIS controla respuesta del agua, sin deducir agua del color.
  Su valor cero también puede ser ausencia de datos. La corrección existente
  del relleno oceánico sigue siendo presentación visual, no datos NASA.
- Bump GEBCO a 0.065 unidades, sin desplazamiento geométrico. No se exageró.
- Se comprueba el contrato de los chunks GLSL antes de modificarlos. La clave
  personalizada sólo versiona nuestra modificación; Three ya incorpora
  map/bump/roughnessMap en su clave nativa. Se corrigió el comentario anterior
  que atribuía erróneamente la carga de textura a una clave estática.
- Se preservan Globe, renderer, canvas, StarField, controles, UI, backend y
  limpieza. No hay estado React por frame ni nuevas dependencias.

## Comparaciones de imagen

### Fuentes oficiales

Se compararon enero, julio y septiembre de 2004 sobre la misma esfera, a 4K,
AgX 1.1, misma iluminación y coordenadas (África, Pacífico y Groenlandia).
La corrección de relleno se desactivó sólo en el navegador de prueba para aislar
la fuente. Enero añade nieve estacional extensa; septiembre cambia vegetación,
pero ninguno mejora el agua profunda. Se conserva julio.

NASA documenta que el océano profundo de BMNG es un relleno uniforme; otro mes
no aporta detalle inexistente. [Fuentes, pipeline y hashes de candidatos](CANDIDATES.md).
No se sirvieron candidatos externos ni se añadieron a los assets de producción.

### Curvas y exposición

Se compararon `NoToneMapping`, AgX, ACES y Neutral a exposición 1.1, sobre
Pacífico, Groenlandia, África y Amazonia. AgX se conserva porque protege luces
altas y mantiene lectura de bosque/océano con menos contraste duro que ACES.
Neutral aumenta contraste y brillo del hielo; sin tone mapping se pierde margen
en las luces altas. Es una evaluación visual, no una calibración radiométrica.

También se probaron AgX 0.9, 1.0 y 1.2 frente al 1.1 actual en agua/hielo.
0.9 oscurece zonas ya débiles; 1.2 realza el reflejo sin recuperar textura.
Se conserva 1.1. No se alteraron colores globales de los JPEG.

### Resoluciones y vistas

2K, 4K y 8K se compararon a altitudes 2.1 y 0.5 en el Mediterráneo:

- 2K: suficiente para el planeta móvil pequeño; borroso al acercamiento máximo.
- 4K: buena relación memoria/nitidez para la vista global.
- 8K: costas, Alpes, Nilo e islas notablemente más nítidos al acercarse;
  no mejora la uniformidad oceánica. Sigue siendo opcional bajo demanda.

Revisión de África/Europa, América del Norte, América del Sur, Asia, Australia,
Pacífico, Atlántico, Ártico/Groenlandia y Antártida. Geografía reconocible, sin
inversión ni retícula por defecto. Tierra firme tiene color natural y volumen;
océanos y hielo interior impiden la aprobación. El limbo sigue siendo el sutil
efecto existente de Globe; no es dispersión física avanzada.

Capturas locales en `output/playwright/`: `earth-final-before.png`,
`earth-final-<region>.png`, `earth-ab-*.png`, `earth-candidate-*.png`,
`earth-final-resolution-*.png` y `earth-final-mobile-*.png`.

## Perfiles y memoria

Se conservó la estrategia existente, sin añadir selector ni motor complejo:

| Perfil | Day | Bump / agua | Memoria aproximada RGBA8 con mipmaps |
| --- | --- | --- | --- |
| Móvil reducido | 2K | 1K / 1K | 16 MiB |
| Escritorio equilibrado | 4K | 2K / 2K | 64 MiB |
| Escritorio detalle | 8K bajo demanda | 2K / 2K | 192 MiB |

La actualización 4K→8K puede tener un pico transitorio de ~235 MiB. JPEG2K:
319.833 bytes; JPEG4K: 1.190.421; JPEG8K: 4.453.772. Disco y memoria GPU
son magnitudes distintas. DPR tiene el límite existente de 2; estas mediciones
usan DPR1, por lo que no certifican pantallas Retina/DPR2.

## Rendimiento medido y límites

Edge Chromium mediante Playwright CLI, Windows, **NVIDIA GeForce RTX 4060**,
ANGLE Direct3D11. Se cuentan cambios de `renderer.info.render.frame`, no sólo
callbacks rAF. La escena actual tiene un único RenderPass. Cuatro tramos de
8 segundos (reposo, arrastre, rueda y abrir/cerrar Layers), sin capturas durante
la muestra. Calentamiento de 5 segundos en la medición final. No es un
benchmark de laboratorio ni una garantía para todo hardware.

| 1920×1080, 4K, DPR1 | FPS medios | Peor ventana de ~1 s | Peor intervalo |
| --- | ---: | ---: | ---: |
| Reposo | 165.03 | 164.98 | 6.3 ms |
| Órbita | 165.09 | 164.98 | 6.2 ms |
| Zoom | 165.02 | 164.98 | 6.3 ms |
| UI | 163.79 | 161.35 | 18.2 ms |

El intervalo aislado de 18.2 ms equivale a 54.9 FPS instantáneos; no se oculta
detrás del promedio. La referencia previa a 1440×900 fue 162.83–165.09 FPS,
con un pico de 54.6 ms durante UI. No se atribuye esa diferencia al shader:
son muestras cortas con distinto viewport.

Con 8K realmente cargado y zoom cercano, a 1920×1080/DPR1, los mismos tramos
dieron 165.08 FPS (reposo), 165.07 (órbita), 165.09 (zoom) y 164.57 (UI).
El mínimo por ventana fue 162.98 FPS y el peor intervalo 12.2 ms. La carga
4K→8K mantuvo el mismo canvas. El muestreo comenzó después de terminar esa
carga: no mide el bloqueo potencial de la primera subida de textura a GPU.

Móvil simulado 390×844, 2K, DPR1, misma RTX4060: 164.97 FPS de media en reposo,
peor intervalo 12.1 ms. **No es una medición en teléfono físico**. Carga diferida
de textura confirmó el mismo nodo canvas antes/después; el zoom conserva 2K.
Los resultados exactos adicionales se guardan en [STAGE-A-MEASUREMENTS.json](STAGE-A-MEASUREMENTS.json).

## Validación y decisión

- TypeScript y build: pasan. Aviso conocido de bundle mayor de 500 kB.
- Lint: no ejecutable; script existe pero ESLint no está instalado. No se
  instaló una dependencia para ocultar ese problema previo.
- Un canvas estable durante carga y cambios 2K/4K/8K; geometrías/texturas
  permanecen acotadas durante los cambios probados. No es una prueba de fuga
  de memoria de larga duración.
- Retícula desactivada por defecto y ambos interruptores de retícula/atmósfera
  verificados sobre la misma escena. Un fallo de day forzado sólo en el
  navegador de prueba conserva la esfera `#344552`; al restaurar la petición
  vuelve a cargar normalmente. El error de red intencional no es un fallo real
  del asset local.
- No errores de shader ni avisos Three en las pruebas. Persisten HTTP500 de
  `/api/health` y `/api/trends/observations` por backend local no disponible.
- UI y archivos de backend no modificados en este pase.

Para reabrir el gate A hace falta una mejora demostrable de respuesta oceánica
en Pacífico/Atlántico y detalle perceptible del hielo, con fuentes oficiales y
sin inventar patrones. Cambiar a otro mes, subir a8K o añadir un halo no lo
resuelve. La luz actual sigue a la cámara para revisión diurna; aún **no** es
un Sol en espacio mundo. No se creó Black Marble, terminador, nubes ni sistema
solar. Se detuvo aquí por la condición explícita del usuario.
