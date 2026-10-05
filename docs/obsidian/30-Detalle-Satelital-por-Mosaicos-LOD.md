# Detalle satelital por mosaicos (LOD) y relieve

Volver al [[00-Map-Of-Content]] · Superficie base: [[12-Superficie-Terrestre-NASA]]
· Material diurno: [[13-Rescate-Realismo-Diurno]]

## Alcance

Al acercar la cámara, el globo carga imágenes satelitales por niveles de detalle, como el
modo satélite de Google Maps, sin perder la vista orbital calibrada (día/noche, nubes,
atmósfera). Es una capa visual de referencia: no cambia con el año ni con la variable del
timeline y no representa datos científicos.

| Capa | Fuente | Nivel máx. | Resolución en el ecuador |
| --- | --- | --- | --- |
| Base diurna | NASA GIBS · `BlueMarble_NextGeneration` | 8 | ≈611 m/px |
| Luces nocturnas | NASA GIBS · `VIIRS_Black_Marble` (2016) | 8 | ≈611 m/px |
| Detalle diurno | NASA GIBS · `Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual` (2000) | 12 | ≈38 m/px |
| Relieve | AWS Terrain Tiles, formato Terrarium (derivado en gran parte del SRTM) | 12 usado | — |

Resolución = 40 075 016 m / (256 · 2^nivel). Como referencia, la textura 8K previa da
≈4,9 km/px: el nivel 12 es unas 128 veces más fino.

Verificado el 2026-10-04: las capas existen en el GetCapabilities EPSG:3857 de GIBS y todas
las URL responden 200 con `Access-Control-Allow-Origin: *`. En S3 de AWS la cabecera CORS
sólo aparece en peticiones GET con `Origin`; una petición HEAD no la muestra.

## Arquitectura

- `earthTileConfig.ts`: fuentes, niveles, altitudes de aparición y crédito.
- `earthTileLayer.ts`: una capa `three-slippy-map-globe` sobre la escena existente.
- `earthTileShader.ts`: amplía el material Lambert de cada mosaico.
- `earthTileVisibility.ts`: qué lado del terminador entra en el horizonte.
- `earthDetailTiles.ts`: orquesta capas, nubes y plano cercano según la altitud.
- `earthEnvelope.ts` / `earthSurface.ts`: `setCloudFade` y la dirección del sol compartida.

### Decisiones

- **No se usa `globe.globeTileEngineUrl()`.** three-globe oculta la esfera base al activarlo,
  y con ella el material GGX, Black Marble, nubes y atmósfera. La capa vive aparte, un poco
  por encima de la superficie, con `polygonOffset` contra el z-fighting.
- **Iluminación real sin código extra.** La librería crea `MeshLambertMaterial`, que responde
  a la luz `earth-sun` en el punto subsolar UTC. Los mosaicos tienen día y noche solos.
- **Noche.** Las capas diurnas se vuelven transparentes en la cara nocturna; la de VIIRS hace
  lo contrario y emite su radiancia. Mismo terminador que el shader de la superficie.
- **Océano.** Landsat WELD rellena el mar con negro puro (medido: RGB 0,0,0, un solo color,
  1 665 bytes por mosaico). El shader descarta esos píxeles y deja ver Blue Marble debajo.
- **Relieve.** Normales perturbadas con la pendiente de Terrarium, iluminadas por el sol real.
  No se desplaza geometría: con la cámara mirando al centro del planeta el desplazamiento
  apenas se ve y abriría grietas entre mosaicos.
- **Plano cercano adaptativo.** Era fijo en 1 unidad (≈64 km) para dar precisión a las nubes.
  Ahora vale 0,35 × la distancia a la superficie, entre 0,02 y 1.
- **Acercamiento.** `minDistance` baja de 1,5 R a 1,0015 R (≈9,6 km sobre la superficie).
- **Nubes.** La textura es 2K; al acercar se desvanecen entre 0,45 y 0,05 radios de altitud.

## Calibración visual del relieve

| Ajuste probado | Resultado en el Everest a ≈51 km |
| --- | --- |
| Exageración 2,5 fija | Laderas a la sombra en negro puro |
| Exageración 0,9 en nivel 12 | Imagen plana y lavada |
| 1,5 en nivel 12 + luz de cielo diurna 0,15/π | Relieve marcado con sombras azuladas plausibles (aprobado) |

La luz de cielo existe porque la ambiental de la escena (0,12) es baja a propósito para la
noche: de día dejaba las laderas sin sol en ≈4 % del lado iluminado.

## Rendimiento medido

Edge sin ventana con ANGLE Direct3D 11 sobre la RTX 4060, 1440×900, DPR 1, 5 s de
`requestAnimationFrame` por escenario. El tope de 165 FPS es la frecuencia del monitor.
Se comparó contra un build de `development` sin estos cambios.

| Escenario | Antes | Primera versión | Optimizada |
| --- | --- | --- | --- |
| Órbita por defecto (giro) | 165 | 165 | 165 |
| Himalaya a 0,5 R, quieto | 165 | 120,5 | 124 (p95 12,2 ms) |
| Himalaya a 0,5 R, girando | 165 | 58,1 | 106,5 (p95 12,2 ms) |
| Everest a 0,06 R y 0,008 R; Bogotá de noche a 0,12 R | — | 165 | 165 |

Optimización aplicada entre la primera versión y la final: búsqueda de mosaicos limitada a
una cada 120 ms, capas apagadas cuando su lado del terminador no entra en el horizonte, y
elevación decodificada con `ImageBitmapLoader` fuera del hilo principal. No se midió por
separado el efecto de cada una.

## Límites conocidos

- Landsat WELD es de 2000: hay zonas urbanas que crecieron desde entonces.
- No hay inclinación de cámara tipo Google Earth; la vista siempre mira al centro.
- La visibilidad día/noche se recalcula al mover la cámara; con la cámara quieta durante
  muchos minutos el terminador puede avanzar sin que la capa nocturna se active.
- Sin prueba en GPU móvil física ni con rueda de ratón física cerca de la superficie.
