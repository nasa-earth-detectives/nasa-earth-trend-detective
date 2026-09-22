"""Genera luces NASA Black Marble y una máscara de nubes separada.

Uso: python scripts/build-earth-orbital-assets.py
Requiere Pillow. Originales en output/earth-source; sólo derivados en public/earth.
No modifica la base diurna, elevación, máscara de agua ni código de render.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "output/earth-source"
DESTINATION = ROOT / "frontend/public/earth"
DOCUMENTATION = ROOT / "docs/obsidian/earth-assets"
NIGHT_URL = (
    "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS"
    "&REQUEST=GetMap&VERSION=1.3.0&LAYERS=VIIRS_Night_Lights&STYLES="
    "&FORMAT=image/png&TRANSPARENT=TRUE&CRS=EPSG:4326"
    "&BBOX=-90,-180,90,180&WIDTH=8192&HEIGHT=4096&TIME=2016-01-01"
)
SOURCES = {
    "black-marble-2016-lights-source.png": {
        "url": NIGHT_URL,
        "product": "NASA Black Marble - Nighttime Lights only (Annual, 2016)",
        "organization": "NASA Earth Observatory / NASA EOSDIS GIBS; Suomi NPP / VIIRS",
        "dimensions": [8192, 4096],
        "mode": "RGBA",
        "sha256": "2851f6dc5c5ebb1c80004c3a0d0e39815df28f7aac65098cac646ec488343fc7",
    },
    "cloud_combined_2048.jpg": {
        "url": "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg",
        "product": "NASA Blue Marble: Clouds, publicación de 2002",
        "organization": "NASA Goddard Space Flight Center; Reto Stöckli, Robert Simmon; Terra / MODIS",
        "dimensions": [2048, 1024],
        "mode": "RGB",
        "sha256": "daddaad84d7a33bbbc86cdda3f591099f57cee8607b7bcf3b67eb7e4f7a1c793",
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
            with urllib.request.urlopen(request, timeout=120) as response:
                path.write_bytes(response.read())
        if digest(path) != spec["sha256"]:
            raise ValueError(f"La fuente cambió; revisar antes de continuar: {path}")
        with Image.open(path) as source:
            if list(source.size) != spec["dimensions"] or source.mode != spec["mode"]:
                raise ValueError(f"Formato o dimensiones inesperadas: {path}")
        records[name] = {**spec, "bytes": path.stat().st_size}
    return records


def main() -> None:
    source_records = fetch_sources()
    for folder in ("night", "clouds"):
        (DESTINATION / folder).mkdir(parents=True, exist_ok=True)
    DOCUMENTATION.mkdir(parents=True, exist_ok=True)

    with Image.open(CACHE / "black-marble-2016-lights-source.png") as source:
        # NASA entrega luces con transparencia: se compone sobre negro ANTES
        # de reducir, sin extraer luces mediante umbrales de una imagen terrestre.
        black = Image.new("RGBA", source.size, (0, 0, 0, 255))
        black.alpha_composite(source)
        lights = black.convert("RGB")
        for width in (4096, 2048):
            lights.resize((width, width // 2), Image.Resampling.LANCZOS).save(
                DESTINATION / f"night/black-marble-2016-{width // 1024}k.jpg",
                quality=94, subsampling=0, optimize=True, progressive=True,
            )

    with Image.open(CACHE / "cloud_combined_2048.jpg") as source:
        # El brillo del mapa gris se utiliza como cobertura visual, no albedo.
        # Sin gamma, umbral, contraste, nubes generadas ni terreno incorporado.
        mask = source.convert("L")
        for width in (2048, 1024):
            output = mask if width == mask.width else mask.resize(
                (width, width // 2), Image.Resampling.LANCZOS
            )
            output.save(DESTINATION / f"clouds/blue-marble-clouds-{width // 1024}k.png", optimize=True)

    output_records = {}
    for relative_path in (
        "night/black-marble-2016-4k.jpg", "night/black-marble-2016-2k.jpg",
        "clouds/blue-marble-clouds-2k.png", "clouds/blue-marble-clouds-1k.png",
    ):
        path = DESTINATION / relative_path
        with Image.open(path) as output:
            width, height = output.size
            output_records[relative_path] = {
                "dimensions": [width, height], "mode": output.mode,
                "bytes": path.stat().st_size, "sha256": digest(path),
                "estimated_rgba8_mipmaps_bytes": round(width * height * 4 * 4 / 3),
            }

    manifest = {
        "pillow_version": pillow_version,
        "sources": source_records,
        "outputs": output_records,
        "processing": {
            "night": {
                "source": "black-marble-2016-lights-source.png",
                "composite": "source RGBA over opaque black before resize",
                "resize": "LANCZOS", "format": "JPEG", "quality": 94,
                "subsampling": "4:4:4", "progressive": True, "optimize": True,
                "color_adjustments": "none", "runtime_color_space": "SRGBColorSpace",
            },
            "clouds": {
                "source": "cloud_combined_2048.jpg", "conversion": "Pillow RGB to L",
                "resize": "none at 2048; LANCZOS at 1024", "format": "PNG",
                "optimize": True, "gamma_or_threshold_or_contrast": "none",
                "runtime_color_space": "NoColorSpace; visual opacity mask",
            },
        },
    }
    (DOCUMENTATION / "orbital-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps(output_records, indent=2))


if __name__ == "__main__":
    main()
