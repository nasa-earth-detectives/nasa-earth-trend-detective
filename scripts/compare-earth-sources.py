"""Prepara candidatos NASA BMNG para A/B; nunca modifica assets de producción.

Uso: python scripts/compare-earth-sources.py
Requiere Pillow. Originales, derivados y manifiesto quedan en output/earth-candidates.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "output/earth-candidates"
NASA_BASE = "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/"
CANDIDATES = {
    "january": {
        "month": "2004-01",
        "source": "world.200401.3x5400x2700.jpg",
        "sha256": "99f5faad74efe985fbf1714c8be7296ca9999759a1215b65f99b7f1df278dde5",
    },
    "september": {
        "month": "2004-09",
        "source": "world.200409.3x5400x2700.jpg",
        "sha256": "ed72e87674861f72e2a6e5df52f0cc6bf3df1edd9b862664cf18ac423e2e9e0e",
    },
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    records = {}
    for name, spec in CANDIDATES.items():
        source_path = DESTINATION / spec["source"]
        url = NASA_BASE + name + "/" + spec["source"]
        if not source_path.exists():
            request = urllib.request.Request(url, headers={"User-Agent": "EarthTrendDetective/1.0"})
            with urllib.request.urlopen(request, timeout=90) as response:
                source_path.write_bytes(response.read())
        if digest(source_path) != spec["sha256"]:
            raise ValueError(f"Fuente modificada; revisar antes de continuar: {source_path}")

        derivative_path = DESTINATION / f"blue-marble-{name}-4k.jpg"
        with Image.open(source_path) as source:
            if source.size != (5400, 2700):
                raise ValueError(f"Dimensiones NASA inesperadas: {source_path}: {source.size}")
            source.convert("RGB").resize((4096, 2048), Image.Resampling.LANCZOS).save(
                derivative_path, quality=92, subsampling=0, optimize=True, progressive=True
            )

        records[name] = {
            "product": "NASA Blue Marble Next Generation, Base Map",
            "month": spec["month"],
            "source": {
                "file": source_path.name,
                "url": url,
                "dimensions": [5400, 2700],
                "bytes": source_path.stat().st_size,
                "sha256": spec["sha256"],
            },
            "derivative": {
                "file": derivative_path.name,
                "dimensions": [4096, 2048],
                "bytes": derivative_path.stat().st_size,
                "sha256": digest(derivative_path),
            },
        }

    manifest = {
        "pillow_version": pillow_version,
        "processing": {
            "conversion": "RGB",
            "resize": "LANCZOS",
            "format": "JPEG",
            "quality": 92,
            "subsampling": "4:4:4",
            "progressive": True,
            "optimize": True,
            "color_adjustments": "none",
            "sharpening": "none",
            "polar_repair": "none; preserve candidate source for neutral A/B",
        },
        "candidates": records,
    }
    (DESTINATION / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
