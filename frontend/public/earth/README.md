# Superficie terrestre: fuentes y preparación

Estos archivos son derivados determinísticos de productos publicados por NASA,
descargados el 21 de septiembre de 2026. No contienen imágenes generadas.
Son material visual de referencia: no representan una medición del año elegido
en el timeline ni cambian según la variable científica seleccionada.

## Archivos servidos localmente

| Ruta desde `/earth/` | Dimensiones | Canal / interpretación | Perfil |
| --- | --- | --- | --- |
| `day/blue-marble-july-4k.jpg` | 4096×2048 | RGB, sRGB | Escritorio inicial |
| `day/blue-marble-july-8k.jpg` | 8192×4096 | RGB, sRGB | Escritorio, zoom cercano opcional |
| `day/blue-marble-july-2k.jpg` | 2048×1024 | RGB, sRGB | Móvil |
| `elevation/gebco-elevation-2k.png` | 2048×1024 | L, altura lineal | Escritorio |
| `elevation/gebco-elevation-1k.png` | 1024×512 | L, altura lineal | Móvil |
| `masks/modis-water-2k.png` | 2048×1024 | L, cobertura de agua | Escritorio |
| `masks/modis-water-1k.png` | 1024×512 | L, cobertura de agua | Móvil |

Dimensiones, bytes y SHA-256 exactos de fuentes y derivados están en
[`asset-manifest.json`](asset-manifest.json). No hay solicitudes a NASA durante
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

Cada subdirectorio contiene el enlace directo a su original y los detalles
de procesamiento. `night` está reservado; no se descargó Black Marble.

## Reproducción

Desde la raíz del repositorio, con Python y Pillow disponibles:

```sh
python scripts/build-earth-assets.py
```

El script descarga fuentes faltantes a `output/earth-source`, valida sus
SHA-256 y dimensiones, y genera los derivados. Las fuentes no forman parte del
build web. Las entregas actuales se produjeron con Pillow **12.3.0**; diferentes
versiones de Pillow/libjpeg pueden generar bytes JPEG distintos. El script
rechaza una fuente cuyo hash haya cambiado para evitar reemplazos silenciosos.

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
  de la guarda. [Límites y algoritmo exactos](day/README.md#cierre-mínimo-del-empalme-polar)
  y los intervalos por fila están documentados en el manifiesto.
- Elevación: reducción Lanczos directa desde el GeoTIFF 5400×2700;
  PNG gris de 8 bits sin gamma añadida ni normalización adicional.
- Agua: alfa RGBA 4096×2048 → escala gris mediante promedio de área BOX;
  PNG sin pérdidas. Los grises costeros representan cobertura parcial.
- Todas las imágenes conservan la proyección equirectangular 2:1, norte arriba,
  longitud −180° en el borde izquierdo y +180° en el derecho.

## Integración y límites

Day debe configurarse como `SRGBColorSpace`; elevación y agua como
`NoColorSpace`. La máscara expresa 255 = agua, 0 = terreno **o ausencia de
datos**; no es una clasificación científica exhaustiva del uso del suelo.
La topografía gris se utiliza para bump sutil; no debe interpretarse como un
DEM de precisión ni exagerarse como desplazamiento de la esfera.

Los perfiles desktop inicial (day 4K + dos auxiliares 2K) y móvil (day 2K +
auxiliares 1K) estiman aproximadamente **64 MiB** y **16 MiB** respectivamente
si la GPU expande cada textura a RGBA8 incluyendo mipmaps. La actualización
opcional a day 8K eleva el conjunto estable de escritorio a **192 MiB**;
durante el reemplazo puede alcanzar **234,7 MiB** mientras coexisten 4K y 8K.
El consumo real depende del formato interno del renderer.

La implementación elige el perfil móvil cuando el ancho inicial es menor que
1024 px, el puntero principal es táctil o `maxTextureSize` es menor que 4096.
No cambia de perfil durante un resize. Transferencia conjunta: escritorio
inicial 1.562.586 bytes; móvil 452.746 bytes. El 8K añade **4.453.772 bytes**
cuando se solicita una sola vez al acercarse a altitud `<= 1.2`. Sólo es
elegible el perfil desktop con `maxTextureSize >= 8192` y, cuando se informa
`deviceMemory`, al menos 8 GiB; móvil permanece en 2K. Esta carga opcional no
reconstruye el globo ni cambia los mapas auxiliares.

La decisión de incluir 8K se tomó tras comparar costas y terreno a zoom
cercano (altitud 0,5), donde mejoró el detalle frente a 4K. Se conserva 4K
al iniciar para limitar transferencia y memoria. No se afirma rendimiento
de 60 FPS: debe medirse en el dispositivo de destino. La estimación de GPU
no incluye imágenes decodificadas en CPU, framebuffer, geometrías ni recursos
del navegador.

## Material diurno revisado

- `MeshStandardMaterial` sustituye Phong una sola vez sobre la misma geometría.
  GGX nativo, metalness 0, emisión negra, bumpScale 0,065 (radio 100).
- La máscara se muestrea una vez para mezclar rugosidad 0,92 de terreno y 0,54
  de agua. F0 pasa de 0,04 de terreno a 0,0204 de agua (IOR 1,333).
  Sin máscara se conserva una respuesta rugosa; no se vuelve brillante todo el globo.
- BMNG **no contiene observaciones de color del océano profundo**. Donde el
  color coincide con su relleno RGB (2,5,20), el material aplica una reflectancia
  difusa lineal aproximada (0,003; 0,017; 0,042), con transición suave y máscara
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
  predeterminadas: ambiente 0,24 y direccional 3,2 relativa a la cámara. No son
  una simulación solar y no definen un lado nocturno científico.
- La superficie se actualiza al cargar el mapa; no hay segundo globo, renderer,
  bucle de animación ni transición de opacidad de la esfera.
- Las tres texturas propias siguen siendo las indicadas en el manifiesto;
  Three r186 añade su LUT DFG interna al usar el material físico.

Se descartaron variantes con topografía sombreada y la versión Blue Marble
2002 con clorofila coloreada. También se evaluó una candidata NOAA VIIRS nLw,
pero tres bandas no constituyen albedo RGB validado y la conversión literal
dio agua aún más oscura. Esas pruebas permanecen fuera de `public`; no se
cargan en la aplicación. Diagnóstico y comparación:
[`13-Rescate-Realismo-Diurno.md`](../../../docs/obsidian/13-Rescate-Realismo-Diurno.md).

API de color y muestreo contrastada con la
[documentación de Texture de Three.js](https://threejs.org/docs/pages/Texture.html)
y el [material Standard](https://threejs.org/docs/pages/MeshStandardMaterial.html).

## Uso y crédito

Crédito de color: **NASA Earth Observatory**. Crédito de elevación: **Jesse
Allen, NASA Earth Observatory; GEBCO / British Oceanographic Data Centre**.
Crédito de agua: **NASA EOSDIS GIBS / MODIS**.

Las [directrices de imágenes y medios de NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/)
permiten usos informativos y educativos de su material, incluidas texturas
de modelos 3D, con atribución y sin sugerir respaldo institucional. NASA indica
que su contenido generalmente no está sujeto a copyright en Estados Unidos;
esto no concede derechos sobre logotipos ni sobre material de terceros
identificado como protegido. No se afirma aprobación de este proyecto por NASA.
