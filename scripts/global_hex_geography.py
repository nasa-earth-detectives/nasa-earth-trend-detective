"""Fuentes Natural Earth verificadas y rasterización de tierra y glaciares."""
from __future__ import annotations

import hashlib
import json
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "output/earth-source"
RAW_SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
SOURCES = {
    "ne_50m_land.geojson": "e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b",
    "ne_50m_glaciated_areas.geojson": "c7a097b4b8e0d360dc82c90ab20c34b78aa5939a5ec8ab157c18945938e9c0a7",
}


def verified_source(name: str) -> dict:
    path = CACHE / name
    if path.exists():
        content = path.read_bytes()
    else:
        request = urllib.request.Request(RAW_SOURCE + name, headers={"User-Agent": "EarthTrendDetective/1.0"})
        with urllib.request.urlopen(request, timeout=45) as response:
            content = response.read()
    if hashlib.sha256(content).hexdigest() != SOURCES[name]:
        raise ValueError(f"La fuente Natural Earth cambió: {name}; revisar antes de reemplazarla")
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    dataset = json.loads(content)
    if dataset.get("type") != "FeatureCollection":
        raise ValueError(f"GeoJSON inválido: {name}")
    return dataset


def rasterize(dataset: dict, size: tuple[int, int]) -> Image.Image:
    """Rasterización equirectangular de polígonos y huecos, respetando su unión."""
    width, height = size
    image = Image.new("L", size)
    for feature in dataset["features"]:
        geometry = feature["geometry"]
        if geometry["type"] == "Polygon":
            polygons = [geometry["coordinates"]]
        elif geometry["type"] == "MultiPolygon":
            polygons = geometry["coordinates"]
        else:
            raise ValueError("Se requieren Polygon o MultiPolygon")
        for rings in polygons:
            for ring in rings:
                if any(abs(a[0] - b[0]) > 180 for a, b in zip(ring, ring[1:])):
                    raise ValueError("Una geometría nueva cruza el antimeridiano sin dividirse")
            projected = [[((lng + 180) / 360 * width, (90 - lat) / 180 * height)
                          for lng, lat in ring] for ring in rings]
            outer = projected[0]
            left = max(0, math.floor(min(x for x, _ in outer)))
            right = min(width, math.ceil(max(x for x, _ in outer)) + 1)
            top = max(0, math.floor(min(y for _, y in outer)))
            bottom = min(height, math.ceil(max(y for _, y in outer)) + 1)
            if right <= left or bottom <= top:
                continue
            bounds = (left, top, right, bottom)
            patch = Image.new("L", (right - left, bottom - top))
            draw = ImageDraw.Draw(patch)
            for index, ring in enumerate(projected):
                draw.polygon([(x - left, y - top) for x, y in ring], fill=255 if index == 0 else 0)
            image.paste(ImageChops.lighter(image.crop(bounds), patch), bounds)
    return image
