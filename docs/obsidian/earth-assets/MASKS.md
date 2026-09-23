# Cobertura de agua para la respuesta del material

- Fuente: NASA EOSDIS GIBS, capa estática `MODIS_Water_Mask`.
- [Capabilities oficial](https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0).
- [Colormap oficial](https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Water_Mask.xml).
- [Original WMS RGBA 4096×2048](https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Water_Mask&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=4096&HEIGHT=2048).
- La fuente verificada contiene `(168,248,255,255)` = Water y
  `(0,0,0,0)` = No Data. Se extrae **alfa**, no se clasifica agua por tono azul.
- `modis-water-2k.png`: 2048×1024, promedio BOX 2×2.
- `modis-water-1k.png`: 1024×512, promedio BOX 4×4.
- `NoColorSpace`; 255 = agua; 0 = terreno o ausencia de datos;
  valores intermedios = cobertura de agua dentro del píxel reducido.
- Sirve como máscara gráfica conservadora de reflejo; no como producto
  hidrológico anual, máscara de hielo ni clasificación científica completa.
- Créditos: NASA EOSDIS GIBS / MODIS. [Contexto MODIS](https://modis.gsfc.nasa.gov/data/dataprod/mod44w.php).
- Fuente y derivados con bytes/hashes en el [manifest](asset-manifest.json).
- Condiciones y reproducción: [README general](README.md).
