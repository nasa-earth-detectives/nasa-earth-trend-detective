"""NDVI mensual de MODIS Terra (capa de NASA GIBS) al CSV que consume el normalizador del ETL.

Por qué por GIBS: el NDVI de MODIS sólo se publica en teselas de 1 km que piden cuenta, y pedirlo a
AppEEARS punto a punto para todo el planeta tarda días (medido: 23 minutos por cada 1 % de una tarea).
GIBS, el servicio abierto de imágenes de la NASA, sirve el mismo producto mensual (L3, MODIS, Terra)
como teselas PNG, sin cuenta. La imagen está pintada con una paleta oficial que asigna a cada color un
intervalo de NDVI, así que el valor se recupera de forma exacta hasta el ancho de ese intervalo.

Qué hace con los datos, y por qué:
  * Baja el nivel 2 de la pirámide (15 teselas por mes, 0,14° por píxel): unos 200 píxeles por celda de
    2°, suficientes para promediar sin descargar el producto entero.
  * Convierte cada color en el punto medio de su intervalo (142 clases, de 0,005 a 0,01 de ancho).
  * Los píxeles transparentes (agua, sin dato o NDVI menor o igual que 0) no entran en el promedio.
  * Una celda con menos de la mitad de su área con dato queda sin fila: no se inventa ni se imputa.
  * Deja la columna anomaly vacía: el NDVI se analiza como índice, no como anomalía.

Requisitos: pip install numpy pillow
Uso (desde la raíz del repo):
    python scripts/etl/gibs_ndvi_to_csv.py
Salida:
    data/nasa/raw/modis_ndvi.csv                 lat, lon, time (AAAA-MM-01), value, anomaly
    backend/seed/modis_ndvi.provenance.json      procedencia que la API expone (se versiona)
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

from power_grid import TARGET_DEGREES, regrid

LAYER = "MODIS_Terra_L3_NDVI_Monthly"
GIBS = "https://gibs.earthdata.nasa.gov"
TILE_URL = GIBS + "/wmts/epsg4326/best/" + LAYER + "/default/{month}-01/1km/{level}/{row}/{col}.png"
COLORMAP_URL = GIBS + "/colormaps/v1.3/MODIS_L3_NDVI.xml"
LEVEL, ROWS, COLS, TILE = 2, 3, 5, 512
DEGREES_PER_PIXEL = 0.5625 / 2 ** LEVEL  # el nivel 0 de la pirámide geográfica de GIBS mide 0,5625° por píxel
VALID_ROWS = round(180 / DEGREES_PER_PIXEL)  # la última fila de teselas sobrepasa el polo sur
CITATION = ("Didan, K. (2021). MODIS/Terra Vegetation Indices Monthly L3 Global 1km SIN Grid V061. NASA EOSDIS "
            "Land Processes DAAC. doi:10.5067/MODIS/MOD13A3.061. Imagen servida por NASA Global Imagery Browse "
            "Services (GIBS), ESDIS.")


def fetch(url: str, path: Path) -> bytes | None:
    """Descarga con caché en disco. Un mes que GIBS no publica (404) se recuerda con un archivo vacío."""
    if path.exists():
        return path.read_bytes() or None
    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            data = response.read()
    except urllib.error.HTTPError as error:
        if error.code not in (400, 404):
            raise
        data = b""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data or None


def color_table(cache: Path) -> np.ndarray:
    """Tabla color -> NDVI, indexada por el color empaquetado en 24 bits. NaN = color sin valor."""
    xml = fetch(COLORMAP_URL, cache / "MODIS_L3_NDVI.xml").decode("utf-8")
    table = np.full(1 << 24, np.nan, dtype="float32")
    for entry in re.findall(r"<ColorMapEntry\b[^>]*>", xml):
        attributes = dict(re.findall(r'(\w+)="([^"]*)"', entry))
        if attributes.get("transparent") == "true" or attributes.get("nodata") == "true":
            continue
        low, high = (float(x) for x in attributes["value"].strip("[]()").split(","))
        red, green, blue = (int(x) for x in attributes["rgb"].split(","))
        table[(red << 16) | (green << 8) | blue] = (low + high) / 2
    return table


def month_grid(month: str, cache: Path, table: np.ndarray, digest: "hashlib._Hash") -> np.ndarray | None:
    """Mosaico del mes en NDVI (latitud de norte a sur), o None si GIBS no tiene ese mes."""
    mosaic = np.full((ROWS * TILE, COLS * TILE), np.nan, dtype="float32")
    for row in range(ROWS):
        for col in range(COLS):
            path = cache / month / f"{LEVEL}_{row}_{col}.png"
            data = fetch(TILE_URL.format(month=month, level=LEVEL, row=row, col=col), path)
            if data is None:
                return None
            digest.update(data)
            rgba = np.asarray(Image.open(path).convert("RGBA"), dtype="uint32")
            packed = (rgba[..., 0] << 16) | (rgba[..., 1] << 8) | rgba[..., 2]
            mosaic[row * TILE:(row + 1) * TILE, col * TILE:(col + 1) * TILE] = np.where(
                rgba[..., 3] > 0, table[packed], np.nan)
    return mosaic[:VALID_ROWS]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--first", default="2000-03", help="primer mes (AAAA-MM); GIBS empieza en 2000-03")
    parser.add_argument("--last", default="2025-12", help="último mes; se cierra en un año completo")
    parser.add_argument("--cache", type=Path, default=Path("data/nasa/raw/gibs_ndvi"))
    parser.add_argument("--output", type=Path, default=Path("data/nasa/raw/modis_ndvi.csv"))
    parser.add_argument("--manifest", type=Path, default=Path("backend/seed/modis_ndvi.provenance.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    first, last = (dt.date.fromisoformat(f"{text}-01") for text in (args.first, args.last))
    months = [f"{year:04d}-{month:02d}" for year in range(first.year, last.year + 1) for month in range(1, 13)
              if first <= dt.date(year, month, 1) <= last]
    table = color_table(args.cache)
    # Primero se baja todo en paralelo (queda en caché); después se procesa mes a mes, en orden.
    jobs = [(TILE_URL.format(month=m, level=LEVEL, row=r, col=c), args.cache / m / f"{LEVEL}_{r}_{c}.png")
            for m in months for r in range(ROWS) for c in range(COLS)]
    with ThreadPoolExecutor(args.workers) as pool:
        list(pool.map(lambda job: fetch(*job), jobs))

    lat = 90 - (np.arange(VALID_ROWS) + 0.5) * DEGREES_PER_PIXEL
    lon = -180 + (np.arange(COLS * TILE) + 0.5) * DEGREES_PER_PIXEL
    centers_lat = np.arange(-90 + TARGET_DEGREES / 2, 90, TARGET_DEGREES)
    centers_lon = np.arange(-180 + TARGET_DEGREES / 2, 180, TARGET_DEGREES)
    digest, rows, used, missing = hashlib.sha256(), 0, [], []
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["lat", "lon", "time", "value", "anomaly"])
        for month in months:
            mosaic = month_grid(month, args.cache, table, digest)
            if mosaic is None:
                missing.append(month)
                continue
            grid = regrid(mosaic[None], lat, lon)[0]
            for b, c in zip(*np.nonzero(np.isfinite(grid))):
                writer.writerow([f"{centers_lat[b]:.1f}", f"{centers_lon[c]:.1f}", f"{month}-01", f"{grid[b, c]:.4f}", ""])
            rows += int(np.isfinite(grid).sum())
            used.append(month)

    manifest = {
        "variable": "ModisNdvi", "provider": "nasa-gibs-modis-terra",
        "product": "MODIS Terra L3 · NDVI mensual (capa MODIS_Terra_L3_NDVI_Monthly de NASA GIBS, media por celda)",
        "baseline": None, "unit": "NDVI", "trendUnit": "NDVI / año", "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": TILE_URL.format(month="{AAAA-MM}", level=LEVEL, row="{fila}", col="{columna}"),
        "sourceFile": f"{LAYER}, nivel {LEVEL}, {len(used)} meses",
        # SHA-256 de las teselas PNG, concatenadas por mes, fila y columna.
        "sourceSha256": digest.hexdigest(),
        "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "coverageStart": int(used[0][:4]), "coverageEnd": int(used[-1][:4]), "lastMonth": used[-1], "rows": rows,
        "processing": "NDVI recuperado de la imagen con la paleta oficial de GIBS (142 clases de 0,005 a 0,01 de "
                      "ancho) y promediado por área a 2°. Los píxeles transparentes (agua, sin dato o NDVI menor "
                      f"o igual que 0) no entran. Meses que GIBS no publica: {', '.join(missing) or 'ninguno'}.",
        "citation": CITATION,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{rows} filas | {used[0]} a {used[-1]} ({len(used)} meses) | sin publicar: {missing or 'ninguno'} | {args.output}")


if __name__ == "__main__":
    main()
