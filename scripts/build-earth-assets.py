"""Genera texturas locales a partir de imágenes verificadas de NASA; requiere Pillow.

Ejecutar desde cualquier directorio: python scripts/build-earth-assets.py
Las fuentes originales se guardan fuera de public, en output/earth-source.
Sin generación ni ajuste global de color; cierre acotado del relleno polar BMNG.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "output/earth-source"
DESTINATION = ROOT / "frontend/public/earth"
DOCUMENTATION = ROOT / "docs/obsidian/earth-assets"
NASA_ASSETS = "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/"
DAY_8K_SOURCE = "world.200407.3x21600x10800.jpg"
# Permite inspeccionar la cabecera de la fuente verificada; nunca se carga a este tamaño.
Image.MAX_IMAGE_PIXELS = 21600 * 10800
WATER_URL = (
    "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS"
    "&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Water_Mask&STYLES="
    "&FORMAT=image/png&TRANSPARENT=TRUE&CRS=EPSG:4326"
    "&BBOX=-90,-180,90,180&WIDTH=4096&HEIGHT=2048"
)
SOURCES = {
    "day-source.jpg": {
        "url": NASA_ASSETS + "bmng-base/july/world.200407.3x5400x2700.jpg",
        "sha256": "f55226d46d27e05511f2118dc6aa24f5dbf9b6b2cddc87cc6e0e7dd067c00b11",
        "dimensions": [5400, 2700],
    },
    DAY_8K_SOURCE: {
        "url": NASA_ASSETS + "bmng-base/july/world.200407.3x21600x10800.jpg",
        "sha256": "dea8b4dc8a4f93f5f8bce0c8c85a508a178e7901e9ed8e6bf86e6ce7ef6d61e2",
        "dimensions": [21600, 10800],
    },
    "elevation-source.tif": {
        "url": NASA_ASSETS + "topography/gebco_08_rev_elev_5400x2700.tif",
        "sha256": "1a4d9f6774d80b19eb0c37efd8fb3b9a36a974417c24a52e559c6645accb5965",
        "dimensions": [5400, 2700],
    },
    "water-mask-source.png": {
        "url": WATER_URL,
        "sha256": "0b1a47277d7aba0ffbf9a798804a3d936d338caa949dfeb9d2db83702b68971c",
        "dimensions": [4096, 2048],
    },
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch_sources() -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    records = {}
    for name, spec in SOURCES.items():
        path = CACHE / name
        if not path.exists():
            request = urllib.request.Request(spec["url"], headers={"User-Agent": "EarthTrendDetective/1.0"})
            with urllib.request.urlopen(request, timeout=90) as response:
                path.write_bytes(response.read())
        if digest(path) != spec["sha256"]:
            raise ValueError(f"La fuente cambió; revisar antes de continuar: {path}")
        with Image.open(path) as image:
            if list(image.size) != spec["dimensions"]:
                raise ValueError(f"Dimensiones inesperadas: {path}")
        records[name] = {**spec, "bytes": path.stat().st_size}
    return records


def close_polar_fill(image: Image.Image) -> dict:
    """Cierra únicamente la contaminación gris conectada al empalme +180° polar."""
    width, height = image.size
    left, bottom = 2 * width // 3, int(height * 6.5 / 180)
    pixel, fill, rows, changed = image.load(), (2, 5, 20), [], 0
    # Hashes de dos regiones disjuntas que abarcan TODO lo exterior a la guarda.
    regions = [(0, 0, left, bottom), (0, bottom, width, height)]
    before = [hashlib.sha256(image.crop(box).tobytes()).hexdigest() for box in regions]
    for y in range(bottom):
        difference = lambda x: max(abs(a - b) for a, b in zip(pixel[x, y], fill))
        if difference(width - 1) <= 6:
            continue
        x = width
        while x > left + 8 and any(difference(k) > 6 for k in range(x - 8, x)):
            x -= 1
        if x <= left + 8:
            raise ValueError("La franja polar excede el océano de relleno verificado")
        start = x - 4  # Halo JPEG mínimo alrededor de la cola conectada.
        changed += sum(pixel[k, y] != fill for k in range(start, width))
        rows.append([y, start, width])  # Intervalo horizontal [inicio, fin).
        image.paste(fill, (start, y, width, y + 1))
    after = [hashlib.sha256(image.crop(box).tobytes()).hexdigest() for box in regions]
    if before != after:
        raise ValueError("La reparación polar alteró píxeles fuera de su guarda")
    return {"working_dimensions": [width, height], "fill_rgb": list(fill),
            "guard": "longitude >= 60 E; latitude > 83.5 N",
            "threshold_per_channel": 6, "background_run": 8, "jpeg_halo_pixels": 4,
            "row_intervals_y_x0_x1_exclusive": rows, "changed_pixels": changed,
            "written_pixels": sum(width - row[1] for row in rows),
            "outside_guard_regions_xyxy": regions, "outside_guard_sha256_before": before,
            "outside_guard_sha256_after": after, "outside_guard_unchanged": before == after}


def main() -> None:
    source_records = fetch_sources()
    DOCUMENTATION.mkdir(parents=True, exist_ok=True)
    for folder in ("day", "elevation", "masks", "night"):
        (DESTINATION / folder).mkdir(parents=True, exist_ok=True)

    with Image.open(CACHE / "day-source.jpg") as original:
        source = original.convert("RGB")
        polar_5400 = close_polar_fill(source)
        for width, quality in ((4096, 92), (2048, 90)):
            image = source.resize((width, width // 2), Image.Resampling.LANCZOS)
            name = f"day/blue-marble-july-{width // 1024}k.jpg"
            image.save(DESTINATION / name, quality=quality, subsampling=0, optimize=True, progressive=True)

    with Image.open(CACHE / DAY_8K_SOURCE) as source:
        # IDCT JPEG reducida: 58,32 MP decodificados, no los 233,28 MP originales.
        source.draft("RGB", (10800, 5400))
        if source.size != (10800, 5400) or source.mode != "RGB":
            raise ValueError("El decoder no aceptó la reducción JPEG 1/2; se cancela antes de load")
        source.load()
        polar_10800 = close_polar_fill(source)
        source.resize((8192, 4096), Image.Resampling.LANCZOS).save(
            DESTINATION / "day/blue-marble-july-8k.jpg",
            quality=92, subsampling=0, optimize=True, progressive=True,
        )

    with Image.open(CACHE / "elevation-source.tif") as source:
        # Conserva intensidad lineal: 0–255 codifica la escala NASA de 0–6400 m.
        for width in (2048, 1024):
            source.convert("L").resize((width, width // 2), Image.Resampling.LANCZOS).save(
                DESTINATION / f"elevation/gebco-elevation-{width // 1024}k.png", optimize=True
            )

    with Image.open(CACHE / "water-mask-source.png") as source:
        # El colormap NASA declara Water opaco y No Data transparente.
        # BOX agrega cobertura de 2×2/4×4 píxeles, sin inferir agua por color RGB.
        for width in (2048, 1024):
            source.getchannel("A").resize((width, width // 2), Image.Resampling.BOX).save(
                DESTINATION / f"masks/modis-water-{width // 1024}k.png", optimize=True
            )

    output_records = {}
    for path in sorted(DESTINATION.rglob("*")):
        if path.suffix not in (".jpg", ".png"):
            continue
        with Image.open(path) as image:
            output_records[path.relative_to(DESTINATION).as_posix()] = {
                "dimensions": list(image.size), "mode": image.mode,
                "bytes": path.stat().st_size, "sha256": digest(path),
            }
    manifest = {"verified_utc": datetime.now(timezone.utc).isoformat(), "pillow_version": pillow_version,
                "sources": source_records, "outputs": output_records,
                "polar_fill_closure": {"day-source.jpg": polar_5400, DAY_8K_SOURCE: polar_10800},
                "processing": {"day/blue-marble-july-8k.jpg": {
                    "source": DAY_8K_SOURCE, "jpeg_decoder_draft_dimensions": [10800, 5400],
                    "resize": "LANCZOS", "quality": 92, "subsampling": "4:4:4",
                    "progressive": True, "optimize": True,
                    "color_adjustments": "no global adjustment; documented polar fill closure before resize",
                    "sharpening": "none",
                }}}
    (DOCUMENTATION / "asset-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(output_records, indent=2))


if __name__ == "__main__":
    main()
