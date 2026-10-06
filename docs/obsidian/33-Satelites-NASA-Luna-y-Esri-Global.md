# Satélites reales de la NASA, Luna, año en curso y Esri en toda la Tierra

Volver al [[00-Map-Of-Content]] · Ronda anterior: [[32-Entorno-Espacial-Satelites-y-Alta-Resolucion]]
· Datos: [[31-Datos-GISTEMP-Reales-e-Integracion-API]]

## Pedido (Diego, 2026-10-05)

- Esri como en Shibuya, pero en toda la Tierra.
- "¿Por qué en todos lados hay calor?"
- Al acercar no carga, se ve pixelado y tarda.
- Año actual (2026), siempre el actual.
- Satélites que se vean reales (en Blender si hace falta), la Luna y un sol realista.
- Arreglar las líneas.

## Satélites: modelos oficiales de la NASA

Descarga autorizada por Diego. Viene de `github.com/nasa/NASA-3D-Resources`:

| Archivo | Tamaño |
| --- | --- |
| Terra.glb | 2,15 MB |
| Aqua (A).glb | 1,99 MB |
| OCO-2.glb | 0,28 MB |
| GRACE (B).glb | 1,78 MB |

GRACE-FO se dibuja con el modelo de GRACE, su predecesora casi idéntica: la NASA no publica GRACE-FO.

Los originales no sirven tal cual:

- cada uno tiene su escala (Terra en milímetros) y su orientación;
- los materiales son planos;
- a Terra le faltan las texturas (`solarpanels.tga` llega vacía) y GRACE trae una textura rosa;
- Aqua y Terra pasan de 115.000 triángulos cada uno.

`scripts/satellites/prepare_nasa_satellites.py` (Blender, sin render) los procesa así:

1. Suelta cada malla de sus padres sin perder la transformación. La primera versión no lo hacía
   y los satélites salían más grandes que la Tierra.
2. Pone las alas en +X, centra en el cuerpo y normaliza el tamaño a 1.
3. Asigna materiales físicos por el nombre del material original: lámina dorada metálica,
   celdas solares, blanco, plata, aluminio y negro.
4. Genera celdas solares con proyección UV donde faltaban (Terra).
5. Reduce sólo las mallas pesadas. Aplicada por igual, la reducción deshacía el panel de Terra.
6. Exporta con Draco: de 6,2 MB a 2,3 MB los cuatro, con 64.767 / 46.634 / 41.004 / 3.961
   triángulos.

`scripts/satellites/preview_satellites.py` los renderiza con Cycles y OptiX en la RTX 4060 (17 s
los cuatro) y aborta si no hay GPU.

En la escena (`satelliteGltf.ts`) se cargan con `GLTFLoader` y `DRACOLoader` (decodificador en
`public/draco/`). El satélite procedural queda de respaldo mientras carga o si falla. Los reflejos
van a intensidad 0,35: a 1 el oro salía casi blanco.

## Luna y sol

- **Luna** (`earthMoon.ts`, `lunarPosition.ts`):
  - Textura y relieve del CGI Moon Kit (NASA SVS 4720). El relieve se pasa a mapa de normales con
    `scripts/moon/build_moon_assets.py`.
  - Se coloca en su dirección real con una serie de baja precisión. Comprobado contra el
    calendario lunar de octubre de 2026: iluminación 39,5 / 28,8 / ~19 % el 4, 5 y 6 a las
    12:00 UTC, frente a 40 / 29 / 20 % publicados; luna nueva el 11 y llena el 26.
  - La fase sale sola, porque la ilumina la misma luz solar.
  - La distancia se comprime a 14 R (la real es ~60 R); el tamaño es el real.
- **Sol:** disco con rayos de difracción finos (destello en estrella) más el destello de lente.

## Año en curso

- `SATELLITE_TIMELINE.endYear` = año UTC actual y el filtro abre en él.
- El año en curso es parcial: la cabecera muestra "2026 · hasta ago" a partir de
  `DatasetProvenance.lastMonth`.
- Corregido el hito de 2024: decía "+1,28 °C s/ media preindustrial"; es sobre la media
  1951-1980 (GISTEMP).

## "¿Por qué en todos lados hay calor?"

Es el dato, no un fallo. Las columnas muestran la anomalía del año respecto a 1951-1980. Medido
con GISTEMP (media ponderada por área):

| Año | Área > 0 | Área > +1 °C | Media |
| --- | --- | --- | --- |
| 2000 | 81,4 % | 9,8 % | +0,40 °C |
| 2010 | 84,3 % | 27,1 % | +0,73 °C |
| 2024 | 97,4 % | 60,6 % | +1,28 °C |
| 2026 (ene-ago) | 97,9 % | 56,4 % | +1,22 °C |

## Mosaicos: carga, pixelado y Esri en toda la Tierra

- **Por qué tarda y se pixela sin clave:**
  - GIBS sirve una mediana de 479 ms por mosaico frente a 124 ms de Esri (10 peticiones de cada uno).
  - Landsat WELD llega a ~38 m/px y es de 2000.
  - Sobre el mar no tiene datos: en la bahía de Bengala se veía debajo el océano de Blue Marble,
    azul marino casi negro con la luz real, con bordes rectos. Se comprobó ocultando capas; no
    eran las esferas negras internas de la librería.
- **Triángulos en las nubes otra vez:** three-slippy-map-globe vuelve a poner
  `depthWrite = true` en cada cambio de nivel. Ahora la propiedad está bloqueada a `false`.
- **Esri en toda la Tierra:**
  - Con clave, la imagen de detalle también se ve de noche, oscurecida y azulada como con luz de
    luna.
  - Las luces de VIIRS pasan encima en aditivo.
  - Probado con la clave ficticia y la reescritura al servidor público: Nueva York de madrugada a
    318 m deja ver calles, casas y coches.
  - Las luces de ciudad apenas se notan sobre la imagen a esa escala.

## Rombos y triángulos (corrección posterior, 2026-10-05)

Diego siguió viendo rombos en cuadrícula, con y sin Esri. **Mi explicación anterior estaba
incompleta**: la profundidad que reactivaba la librería era un problema real, pero no la causa de
los rombos.

**Causa:**
- three-slippy-map-globe construye los mosaicos con caras de 5° (`curvatureResolution` 5). Entre
  vértices, la cara se hunde R·(1 − cos 2,5°) ≈ 606 m bajo la esfera.
- Las capas flotan sólo 127-255 m (13-25 m con Esri).
- Por eso los vértices de la esfera base (rejilla de 4°) asomaban por encima y dibujaban rombos.
- Comprobado apagando capas: sin las nubes los rombos seguían; sin Blue Marble desaparecían.
- Sólo se ve si uno se acerca poco a poco, porque la librería conserva debajo los mosaicos
  grandes de niveles bajos. Saltando directamente a la altura final no aparecían, y por eso mi
  prueba anterior en Australia "salió limpia".

**Solución:** se hunde la esfera base un 0,15 % (9,6 km), siempre por debajo de cualquier cara de
mosaico. Hay que aplicarlo cuando la malla del globo ya está en la escena: buscada al crear la
capa, la escala seguía en 1.

**Bandas en zigzag de noche con Esri:** las causaba la mezcla aditiva de VIIRS. Black Marble tiene
fondo azul marino y la librería superpone varios niveles, así que el fondo se sumaba 2-3 veces.
Ahora las luces van con mezcla normal y sólo ellas son opacas (`lightsOnly`).

**Conos, arcos y anillos cerca del suelo:** los conos se desvanecen entre 0,45 y 0,12 radios de
altitud de cámara; arcos y anillos se ocultan por debajo de 0,15 radios. Antes llenaban la
pantalla de verde y naranja.

Verificado acercándose poco a poco al Índico de día, a EE. UU. de noche y al Amazonas, con la
clave real de Diego en el servidor de desarrollo: sin rombos, sin zigzag y sin conos tapando.

## Líneas

- Corrientes oceánicas apagadas por defecto (se pueden encender desde el panel).
- Arcos continuos con degradado, sin guiones ni pulsos.

## Medido

FPS con Edge sin ventana a 1440×900 en la RTX 4060, del build de la ronda anterior frente a este:

| Escenario | Antes | Después |
| --- | --- | --- |
| Órbita | 165 | 165 |
| Himalaya, quieto | 125,1 | 136,7 |
| Himalaya, girando | 110,7 | 131,2 |
| Everest 380 km | 164,2 | 165 |
| Everest 51 km · Bogotá | 165 | 165 |

No hay pérdida medible con los modelos reales. Las cifras a media altura varían mucho entre
pasadas por la carga de mosaicos por red.

## Pendiente

- La clave de Esri del equipo se gestiona de forma segura mediante `frontend/.env.local` (local)
  y en GitHub Secrets / Vercel (despliegue), evitando versionar credenciales en el repositorio.
  Admite localhost y 127.0.0.1 en los puertos 3000 y 4173: para Vercel hay que añadir su dominio
  en ArcGIS. Caduca el 3 de enero de 2027.
- No se pudo confirmar en la documentación de Esri si el registro gratuito pide tarjeta.
- Luces de ciudad más visibles sobre Esri de noche.
- Probar en un móvil real.
