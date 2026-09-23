# Assets orbitales: luces nocturnas y nubes separadas

Fuentes verificadas y derivados generados el 22 de septiembre de 2026.
Este documento registra los assets; su presencia no certifica por sí sola
la calidad visual, el rendimiento ni la iluminación del renderer.

## NASA Black Marble 2016: sólo luces

- Producto: **Black Marble — Nighttime Lights only (Annual, 2016)**.
- Organización: NASA Earth Observatory / NASA EOSDIS GIBS; observaciones
  Suomi NPP / VIIRS. Créditos de Black Marble: equipo de Miguel Román,
  NASA Goddard; imágenes de NASA Earth Observatory por Joshua Stevens.
- Capa oficial de GIBS: `VIIRS_Night_Lights`; fecha WMS: `2016-01-01`.
- [Descripción de NASA GIBS](https://github.com/nasa-gibs/worldview-options-eosdis/blob/master/common/config/metadata/viirs/EarthAtNight.md).
- [Catálogo NASA Earth at Night](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/).
- [Capabilities WMS oficial](https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0).
- [PNG global solicitado a GIBS, 8192×4096](https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=VIIRS_Night_Lights&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=8192&HEIGHT=4096&TIME=2016-01-01).

La fuente descargada es una imagen de visualización WMS RGBA de
**8192×4096**, 2.211.217 bytes, no el raster científico nativo. Se conserva
como `output/earth-source/black-marble-2016-lights-source.png`.
El servicio anuncia globalmente −180…180° / −90…90° y las fechas de compuesto
2012 y 2016. El eje de `BBOX` sigue WMS 1.3.0 EPSG:4326: latitud, longitud.

Esta capa contiene las luces sobre transparencia. Se descartó para emisión
el JPEG oficial `BlackMarble_2016_3km.jpg` porque incluye un fondo azul de
tierra/hielo: emitir ese fondo haría brillar continentes completos.
No se extraen las luces con un umbral arbitrario ni se resta el azul del JPEG.

Procesamiento: composición del RGBA original sobre negro opaco → RGB →
Lanczos → JPEG progresivo 4:4:4 de calidad 94. La composición usa el alfa de
NASA antes de reducir; no se añade brillo, color, nitidez ni bloom. El mapa
resultante es prácticamente neutro. Si el material aplica una temperatura
visual a la luz, ésta no debe presentarse como color espectral medido.

| Ruta desde `/earth/` | Resolución local | Bytes | Uso previsto |
| --- | --- | --- | --- |
| `night/black-marble-2016-4k.jpg` | 4096×2048 | 308.155 | Escritorio, emisión en lado nocturno |
| `night/black-marble-2016-2k.jpg` | 2048×1024 | 90.107 | Móvil, emisión en lado nocturno |

Interpretación: `SRGBColorSpace`, como imagen preparada para visualización.
No equivale a radiancia lineal ni a un producto anual vinculado al timeline.
La máscara solar y el balance de emisión pertenecen al material; este mapa
no contiene terminador ni debe mezclarse globalmente con la base diurna.
Las luces pueden incluir otras fuentes humanas, además de ciudades.

SHA-256 fuente:

```text
2851f6dc5c5ebb1c80004c3a0d0e39815df28f7aac65098cac646ec488343fc7
```

## NASA Blue Marble: Clouds

- Producto: **Blue Marble: Clouds**, publicado el 11 de febrero de 2002.
- NASA Goddard Space Flight Center; Reto Stöckli, con procesamiento y
  composición de Robert Simmon; Terra / MODIS.
- [Registro histórico NASA Visible Earth 57747](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l).
- [Original NASA `cloud_combined_2048.jpg`](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg).
- La ficha histórica describe dos días de imágenes visibles y un tercer día
  de infrarrojo térmico para completar las regiones polares. No se atribuye
  una fecha exacta de observación que no esté documentada.

El original descargado mide **2048×1024**, es JPEG RGB y ocupa 829.367 bytes.
Se inspeccionó: contiene nubes grises sobre negro, sin continentes de color
ni océanos incorporados. La ficha histórica puede redirigir a Earth Observatory
tras la migración de Visible Earth; el archivo oficial `eoimages.gsfc.nasa.gov`
respondió directamente como JPEG en la fecha de verificación.

Procesamiento: `RGB → L` de Pillow; PNG gris sin pérdidas. El derivado 2K
conserva la resolución de origen; el 1K se reduce con Lanczos. No se aplica
contraste, umbral, gamma, generación de nubes ni alteración regional.
La compresión PNG evita una nueva generación JPEG sobre sus detalles finos.

| Ruta desde `/earth/` | Resolución local | Bytes | Uso previsto |
| --- | --- | --- | --- |
| `clouds/blue-marble-clouds-2k.png` | 2048×1024 | 1.377.853 | Cobertura visual de nube, escritorio |
| `clouds/blue-marble-clouds-1k.png` | 1024×512 | 369.075 | Cobertura visual de nube, móvil |

Interpretación: `NoColorSpace`, canal gris usado como opacidad/cobertura
visual sobre una capa independiente. **No es RGBA**; cero significa
transparente en el material. El color y la iluminación de nube se calculan
aparte con la misma dirección solar de la Tierra.

No representa meteorología actual, una observación del año del timeline,
profundidad óptica calibrada ni una predicción. El compuesto histórico puede
mostrar uniones de observaciones y distorsión polar equirectangular.

SHA-256 fuente:

```text
daddaad84d7a33bbbc86cdda3f591099f57cee8607b7bcf3b67eb7e4f7a1c793
```

## Reproducción, orientación y memoria

```sh
python scripts/build-earth-orbital-assets.py
```

Requiere Pillow. La entrega se generó con **Pillow 12.3.0**. El script descarga
sólo fuentes ausentes a `output/earth-source/`, valida SHA-256, dimensiones
y modo, y genera exclusivamente los cuatro derivados indicados. Una fuente
que haya cambiado detiene el proceso. El manifiesto separado
[`orbital-manifest.json`](orbital-manifest.json) registra fuentes, salidas,
hashes, bytes y parámetros. Otra versión de Pillow/libjpeg puede producir
bytes JPEG diferentes aun con los mismos parámetros.

Las imágenes mantienen proyección equirectangular 2:1, norte arriba, longitud
−180° a la izquierda y +180° a la derecha. No se espejan ni desplazan.
No hay solicitudes remotas de estas imágenes durante la ejecución web:
Vite sirve los derivados desde `frontend/public/earth`.

Estimación conservadora si el navegador expande cada mapa a RGBA8 con mipmaps:

| Perfil | Luces | Nubes | Incremento de mapas |
| --- | --- | --- | --- |
| Escritorio, 4K + 2K | 42,7 MiB | 10,7 MiB | 53,3 MiB |
| Móvil, 2K + 1K | 10,7 MiB | 2,7 MiB | 13,3 MiB |

Los PNG grises pueden admitir formatos internos menores según el loader,
pero no se presupone ese ahorro. Estos valores no incluyen framebuffer,
geometrías, copias CPU ni los mapas diurnos. No son mediciones reales de GPU.

## Uso y crédito

Se mantienen créditos de NASA Earth Observatory / NASA Goddard / NASA GIBS
y los equipos mencionados. Las [directrices de NASA sobre imágenes y medios](https://www.nasa.gov/nasa-brand-center/images-and-media/)
permiten usos informativos/educativos con atribución; no implican aprobación
institucional ni conceden derechos sobre logotipos o material de terceros.
