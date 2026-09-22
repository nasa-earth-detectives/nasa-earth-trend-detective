# Topografía para bump

- Producto: GEBCO 08, topografía terrestre en escala gris publicada por NASA.
- [Página oficial con escala 0–6400 m](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/).
- [Original GeoTIFF 5400×2700, 14.596.566 bytes](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.tif).
- Crédito: Jesse Allen / NASA Earth Observatory; datos GEBCO / British
  Oceanographic Data Centre.
- `gebco-elevation-2k.png`: 2048×1024; `gebco-elevation-1k.png`: 1024×512.
- Proceso: canal gris original de 8 bits → reducción Lanczos → PNG optimizado.
- Intensidades conservadas; no autocontraste, inversión ni conversión de gamma.
- `NoColorSpace`; luminosidad proporcional a la altura representada por NASA.
- El GeoTIFF declara EPSG:4326 y origen −180°, +90°; se conserva orientación.
- No contiene profundidad oceánica y no debe usarse como DEM de precisión.
- Bytes/hashes: [manifest](../asset-manifest.json). Uso: [README general](../README.md).
