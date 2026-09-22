# Superficie terrestre: fuentes y preparación

Revisión actual del 22 de septiembre de 2026:
[sistema orbital y validación final](FINAL-ORBITAL-REVIEW.md).
Black Marble y las nubes separadas ya están integrados, junto al ciclo día/noche
y la atmósfera sensible a la luz. El [control de etapa A](STAGE-A-REVIEW.md)
conserva la evidencia histórica de la evaluación anterior; su estado de pausa
fue superado por este pase y no describe la integración actual.

Estos archivos son derivados determinísticos de productos publicados por NASA,
descargados el 21 y 22 de septiembre de 2026. No contienen imágenes generadas.
Son material visual de referencia: no representan una medición del año elegido
en el timeline ni cambian según la variable científica seleccionada.

## Archivos servidos localmente

| Ruta desde `/earth/` | Dimensiones | Canal / interpretación | Perfil |
| --- | --- | --- | --- |
| `day/blue-marble-july-4k.jpg` | 4096×2048 | RGB, sRGB | Escritorio inicial; detalle móvil opcional |
| `day/blue-marble-july-8k.jpg` | 8192×4096 | RGB, sRGB | Escritorio, zoom cercano opcional |
| `day/blue-marble-july-2k.jpg` | 2048×1024 | RGB, sRGB | Móvil inicial |
| `elevation/gebco-elevation-2k.png` | 2048×1024 | L, altura lineal | Escritorio |
| `elevation/gebco-elevation-1k.png` | 1024×512 | L, altura lineal | Móvil |
| `masks/modis-water-2k.png` | 2048×1024 | L, cobertura de agua | Escritorio |
| `masks/modis-water-1k.png` | 1024×512 | L, cobertura de agua | Móvil |
| `night/black-marble-2016-4k.jpg` | 4096×2048 | RGB, sRGB, luces sobre negro | Escritorio |
| `night/black-marble-2016-2k.jpg` | 2048×1024 | RGB, sRGB, luces sobre negro | Móvil |
| `clouds/blue-marble-clouds-2k.png` | 2048×1024 | L, cobertura visual de nube | Escritorio |
| `clouds/blue-marble-clouds-1k.png` | 1024×512 | L, cobertura visual de nube | Móvil |

Dimensiones, bytes y SHA-256 exactos de fuentes y derivados están en
[`asset-manifest.json`](asset-manifest.json) y, para luces y nubes,
[`orbital-manifest.json`](orbital-manifest.json). No hay solicitudes a NASA durante
la ejecución de la aplicación: Vite sirve `public/earth` y copia los archivos
al build sin incorporarlos como módulos JavaScript.

## Procedencia

- **Color diurno:** [NASA Blue Marble: Next Generation, Base Map](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/),
  compuesto de julio de 2004, Terra/MODIS, Reto Stöckli / NASA Earth Observatory.
  Se usa el mapa base sin nubes añadidas, topografía sombreada ni batimetría
  decorativa. Los océanos profundos de BMNG usan un color uniforme; NASA
  documenta imperfecciones en aguas abiertas y transiciones costeras.
  Los derivados 2K/4K parten del original 5400×2700; el 8K parte del
  [original NASA 21600×10800](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x21600x10800.jpg),
  de 21.125.326 bytes. El 8K no es una ampliación del 4K.
- **Elevación:** [NASA BMNG Topography and Bathymetry Maps](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/),
  topografía GEBCO 08, representación de altura terrestre escalada 0–6400 m.
  Imagen de Jesse Allen / NASA Earth Observatory, datos GEBCO / British
  Oceanographic Data Centre. Se usa la topografía, no la batimetría.
- **Agua:** [NASA GIBS](https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0),
  capa estática `MODIS_Water_Mask`. Su
  [colormap oficial](https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Water_Mask.xml)
  identifica agua opaca y ausencia de datos transparente. El archivo local
  almacena ese canal alfa, no el color cian de la visualización.
  No se atribuye a esta capa estática una versión anual MOD44W no documentada.
- **Luces nocturnas:** NASA Black Marble 2016, capa oficial GIBS
  `VIIRS_Night_Lights`, compuesta sólo por luces sobre transparencia. Se conserva
  la imagen sobre fondo negro para emisión condicionada al hemisferio nocturno;
  no se utiliza el JPEG que incluye un fondo azul de tierra y hielo.
- **Nubes:** NASA Blue Marble: Clouds, compuesto histórico publicado en 2002,
  `cloud_combined_2048.jpg`. Es una máscara gris de nubes sin superficie diurna
  incorporada, usada sobre una esfera separada. No representa meteorología actual.

Los documentos `DAY.md`, `ELEVATION.md` y `MASKS.md` contienen los enlaces
directos a cada original y sus detalles de procesamiento. [NIGHT.md](NIGHT.md)
describe la integración nocturna; [ORBITAL-SOURCES.md](ORBITAL-SOURCES.md)
documenta fuentes, procesamiento y límites de luces y nubes.

## Reproducción

Desde la raíz del repositorio, con Python y Pillow disponibles:

```sh
python scripts/build-earth-assets.py
python scripts/build-earth-orbital-assets.py
```

Los scripts descargan fuentes faltantes a `output/earth-source`, validan sus
SHA-256 y dimensiones, y generan los derivados. Las fuentes no forman parte del
build web. Las entregas actuales se produjeron con Pillow **12.3.0**; diferentes
versiones de Pillow/libjpeg pueden generar bytes JPEG distintos. Ambos scripts
rechazan una fuente cuyo hash haya cambiado para evitar reemplazos silenciosos.

- Day 2K/4K: reducción Lanczos desde 5400×2700; JPEG progresivo 4:4:4,
  calidad 92 para 4K y 90 para 2K; sin ajuste global de color, contraste o saturación.
- Day 8K: fuente 21600×10800, validada por hash, decodificada con JPEG
  `draft` a 10800×5400 (1/2 por eje) **antes** de cargar píxeles. Después,
  Lanczos a 8192×4096 y JPEG92 progresivo 4:4:4, sin reenfoque ni ajuste global.
  Así se decodifican 58,32 MP, no 233,28 MP. La IDCT reducida no equivale
  bit a bit a decodificar el original completo; se registra en el manifiesto.
  Se reutiliza `output/earth-source/world.200407.3x21600x10800.jpg` si existe.
- Antes de Lanczos se cierra una franja gris del empalme polar del relleno BMNG,
  exclusivamente en la cola derecha conectada a +180°, por encima de 83,5° N.
  Se modifica el relleno uniforme, no observaciones de hielo/agua. Los originales
  permanecen intactos; hashes antes/después verifican todos los píxeles fuera
  de la guarda. [Límites y algoritmo exactos](DAY.md#cierre-mínimo-del-empalme-polar)
  y los intervalos por fila están documentados en el manifiesto.
- Elevación: reducción Lanczos directa desde el GeoTIFF 5400×2700;
  PNG gris de 8 bits sin gamma añadida ni normalización adicional.
- Agua: alfa RGBA 4096×2048 → escala gris mediante promedio de área BOX;
  PNG sin pérdidas. Los grises costeros representan cobertura parcial.
- Luces: capa GIBS RGBA 8192×4096 de 2016 sobre negro opaco → reducción Lanczos
  → JPEG94 progresivo 4:4:4, a 4096×2048 y 2048×1024. Sin extracción mediante
  umbrales de color, aumento de brillo, tintado ni bloom en los assets.
- Nubes: RGB gris 2048×1024 → L → PNG sin pérdidas a 2K; Lanczos para 1K.
  Sin ajustes de gamma, contraste o umbrales en la imagen derivada.
- Todas las imágenes conservan la proyección equirectangular 2:1, norte arriba,
  longitud −180° en el borde izquierdo y +180° en el derecho.

## Integración y límites

Day y Black Marble deben configurarse como `SRGBColorSpace`; elevación, agua
y cobertura de nube como `NoColorSpace`. La máscara de agua expresa
255 = agua, 0 = terreno **o ausencia de
datos**; no es una clasificación científica exhaustiva del uso del suelo.
La topografía gris se utiliza para bump sutil; no debe interpretarse como un
DEM de precisión ni exagerarse como desplazamiento de la esfera.

El conjunto activo contiene **cinco mapas**: day, elevación, agua, luces y nubes.
Estimación de memoria si cada textura se expande a RGBA8 incluyendo mipmaps:

| Perfil | Day / luces | Elevación / agua / nubes | Total de mapas |
| --- | --- | --- | --- |
| Mobile Reduced | 2K / 2K | 1K / 1K / 1K | **29,33 MiB** |
| Móvil, detalle cercano elegible | 4K / 2K | 1K / 1K / 1K | **61,33 MiB** |
| Desktop Balanced | 4K / 4K | 2K / 2K / 2K | **117,33 MiB** |
| Desktop High, zoom cercano | 8K / 4K | 2K / 2K / 2K | **245,33 MiB** |

Durante el reemplazo de day 2K por 4K en móvil pueden coexistir temporalmente
ambos mapas, hasta aproximadamente **72 MiB**. En escritorio, el reemplazo
4K por 8K puede alcanzar aproximadamente **288 MiB**. El consumo real depende del formato
interno del renderer; estos números no son una medición de memoria GPU total.

La implementación elige el perfil móvil cuando el ancho inicial es menor que
1024 px, el puntero principal es táctil o `maxTextureSize` es menor que 4096.
No cambia de perfil durante un resize. Transferencia conjunta de los cinco
mapas: escritorio inicial 3.248.594 bytes; móvil inicial 911.928 bytes.
Tras una interacción de cámara y al acercarse a altitud `<= 1.2`, se permite
una única mejora opcional del mapa diurno:

- Móvil: **2K → 4K**, sólo con `maxTextureSize >= 4096` y `deviceMemory`
  conocido de al menos 4 GiB. Añade 1.190.421 bytes de transferencia. Si la
  memoria no se informa o es inferior al umbral, conserva 2K. Nunca carga 8K.
- Escritorio: **4K → 8K**, con `maxTextureSize >= 8192` y, cuando se informa
  `deviceMemory`, al menos 8 GiB. Si esa API no existe, la capacidad de textura
  permite la mejora. Añade 4.453.772 bytes de transferencia.

Ambas cargas conservan el mapa inicial mientras esperan; si fallan, lo
mantienen sin reintentos. Al completar la sustitución se libera el anterior.
No reconstruyen el globo ni cambian luces, elevación, agua o nubes.

La decisión de incluir 8K se tomó tras comparar costas y terreno a zoom
cercano (altitud 0,5), donde mejoró el detalle frente a 4K. Se conserva 4K
al iniciar para limitar transferencia y memoria. Las mediciones de rendimiento
y sus límites se registran en [la revisión final](FINAL-ORBITAL-REVIEW.md);
la resolución de una textura no garantiza 60 FPS. La estimación de GPU
no incluye imágenes decodificadas en CPU, framebuffer, geometrías ni recursos
del navegador.

## Material diurno y sistema orbital

- `MeshStandardMaterial` sustituye Phong una sola vez sobre la misma geometría.
  GGX nativo, metalness 0, bumpScale 0,1 (radio 100). La emisión de Black Marble
  queda limitada al lado nocturno, con intensidad configurada de 1,4.
- La máscara se muestrea una vez para mezclar rugosidad 0,92 de terreno y 0,12
  de agua. F0 pasa de 0,04 de terreno a 0,0204 de agua (IOR 1,333).
  Sin máscara se conserva una respuesta rugosa; no se vuelve brillante todo el globo.
- BMNG **no contiene observaciones de color del océano profundo**. Donde el
  color coincide con su relleno RGB (2,5,20), el material aplica una reflectancia
  difusa lineal aproximada (0,003; 0,014; 0,035), con transición suave y máscara
  de agua. Es un parámetro visual del material, **no un color medido por NASA**,
  ni un albedo radiométrico validado. No se inventan variaciones regionales.
  La corrección es aditiva, modulada por cercanía al relleno (distancia lineal
  0,002–0,12): conserva la variación de la fuente y evita escalones en costas.
  Puede ajustar también el nivel de agua costera oscura; no es colorimetría
  oceánica calibrada. Fuera de la máscara de agua no altera el albedo.
- Mipmaps activos, minificación `LinearMipmapLinearFilter`, magnificación
  `LinearFilter`, anisotropía limitada a `min(4, máximo del dispositivo)`.
- Repetición longitudinal y clamp en latitud; `flipY=true`, sin inversión ni
  desplazamientos arbitrarios. La geometría de Globe ya orienta Greenwich.
- Renderer sRGB con `AgXToneMapping` y exposición 1,1. Dos luces reemplazan las
  predeterminadas: ambiente 0,12 y direccional 3,2. La direccional ya no sigue
  la cámara: comparte `sunDirection` en referencia fija a la Tierra con la
  máscara nocturna, las nubes y la atmósfera.
- El Sol parte de latitud 12° y longitud −65° y avanza en un ciclo visual de
  **20 minutos**. El movimiento se pausa con «Rotación automática» desactivada
  o `prefers-reduced-motion: reduce`. Orbitar con la cámara no arrastra el
  terminador. Es un ciclo de presentación, **no efemérides ni fecha del timeline**.
- Las luces emergen gradualmente al pasar el coseno solar de 0 a −0,12;
  desaparecen por completo en el hemisferio diurno. No hay mezcla global 50/50.
- Las nubes forman una esfera independiente y la atmósfera un limbo transparente
  sensible a la luz. Ambos reciben la misma dirección solar. No hay bloom,
  lens flare, sombras de nubes ni sistema meteorológico animado.
- La superficie se actualiza al cargar el mapa; no hay segundo globo, renderer,
  bucle de animación ni transición de opacidad de la esfera.
- Las cinco texturas propias están registradas en los dos manifiestos;
  Three r186 añade su LUT DFG interna al usar el material físico.

Se descartaron variantes con topografía sombreada y la versión Blue Marble
2002 con clorofila coloreada. También se evaluó una candidata NOAA VIIRS nLw,
pero tres bandas no constituyen albedo RGB validado y la conversión literal
dio agua aún más oscura. Esas pruebas permanecen fuera de `public`; no se
cargan en la aplicación. Diagnóstico y comparación:
[`13-Rescate-Realismo-Diurno.md`](../13-Rescate-Realismo-Diurno.md).

API de color y muestreo contrastada con la
[documentación de Texture de Three.js](https://threejs.org/docs/pages/Texture.html)
y el [material Standard](https://threejs.org/docs/pages/MeshStandardMaterial.html).

## Uso y crédito

Crédito de color: **NASA Earth Observatory**. Crédito de elevación: **Jesse
Allen, NASA Earth Observatory; GEBCO / British Oceanographic Data Centre**.
Crédito de agua: **NASA EOSDIS GIBS / MODIS**. Luces: **NASA Earth Observatory,
NASA Goddard / Suomi NPP VIIRS, servidas por NASA GIBS**. Nubes: **NASA Goddard,
Reto Stöckli y Robert Simmon / Terra MODIS**.

Las [directrices de imágenes y medios de NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/)
permiten usos informativos y educativos de su material, incluidas texturas
de modelos 3D, con atribución y sin sugerir respaldo institucional. NASA indica
que su contenido generalmente no está sujeto a copyright en Estados Unidos;
esto no concede derechos sobre logotipos ni sobre material de terceros
identificado como protegido. No se afirma aprobación de este proyecto por NASA.
