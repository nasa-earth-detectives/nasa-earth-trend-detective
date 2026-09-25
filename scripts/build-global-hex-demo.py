"""Genera cobertura estática de 8192 centros globales ficticios, con Pillow existente.

python scripts/build-global-hex-demo.py
python scripts/build-global-hex-demo.py --check

La NASA aporta una máscara gráfica de agua; Natural Earth resuelve tierra polar
y superficies glaciadas. Ninguna de estas referencias aporta las pendientes demo.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path

from PIL import Image, ImageChops

from global_hex_geography import SOURCES, rasterize, verified_source

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "frontend/src/services/demo/hexGlobalCoverage.ts"
MASK = ROOT / "frontend/public/earth/masks/modis-water-2k.png"
WATER_HASH = "5fdaf3bae60b6c5d43218661fc2d1971136c1d9d37b06b3d6dea59608dcfb093"
COUNT = 8192
GOLDEN_ANGLE = 137.50776405003785
RESOLUTION = 2.2
FOOTPRINT_RADIUS_FACTOR = 0.34
COASTAL_BUFFER = 0.20
MAX_INLAND_WATER_FRACTION = 0.08


def regional_helpers():
    spec = importlib.util.spec_from_file_location("hex_coverage_helpers", ROOT / "scripts/build-hex-demo-coverage.py")
    if not spec or not spec.loader:
        raise ValueError("No se encuentra el helper de cobertura de agua")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fibonacci_centers() -> list[tuple[float, float]]:
    return [(math.degrees(math.asin(1 - 2 * (index + 0.5) / COUNT)),
             ((index * GOLDEN_ANGLE + 180) % 360) - 180) for index in range(COUNT)]


def coverage_flag(latitude: float, longitude: float, water: Image.Image, land: Image.Image,
                  forbidden: Image.Image, ice: Image.Image, water_at) -> str:
    if water_at(land, latitude, longitude) == 0 or water_at(water, latitude, longitude) > 0:
        return "0"
    width, height = water.size
    pixel_guard = math.hypot(360 / width, 180 / height) / 2
    radius = RESOLUTION * FOOTPRINT_RADIUS_FACTOR + COASTAL_BUFFER + pixel_guard
    latitude_rad = math.radians(latitude)
    if abs(latitude) + radius >= 90:
        left, right = 0, width - 1
    else:
        longitude_radius = math.degrees(math.asin(min(1, math.sin(math.radians(radius)) / math.cos(latitude_rad))))
        left = math.floor((longitude - longitude_radius + 180) / 360 * width)
        right = math.ceil((longitude + longitude_radius + 180) / 360 * width)
    top = max(0, math.floor((90 - latitude - radius) / 180 * height))
    bottom = min(height - 1, math.ceil((90 - latitude + radius) / 180 * height))
    limit = math.sin(math.radians(radius) / 2) ** 2
    water_pixels, forbidden_pixels, ice_pixels = water.load(), forbidden.load(), ice.load()
    water_sum, count = 0, 0
    has_ice = False
    for y in range(top, bottom + 1):
        pixel_lat = math.radians(90 - (y + 0.5) / height * 180)
        latitude_term = math.sin((pixel_lat - latitude_rad) / 2) ** 2
        cosine = math.cos(latitude_rad) * math.cos(pixel_lat)
        for x in range(left, right + 1):
            pixel_lng = (x + 0.5) / width * 360 - 180
            haversine = latitude_term + cosine * math.sin(math.radians(pixel_lng - longitude) / 2) ** 2
            if haversine > limit:
                continue
            wrapped_x = x % width
            if forbidden_pixels[wrapped_x, y] > 0:
                return "0"
            count += 1
            water_sum += water_pixels[wrapped_x, y]
            has_ice = has_ice or ice_pixels[wrapped_x, y] > 0
    if not count or water_sum / (255 * count) > MAX_INLAND_WATER_FRACTION:
        return "0"
    return "1" if has_ice else "3"


def validate_references(water: Image.Image, land: Image.Image, ice: Image.Image, forbidden: Image.Image, water_at) -> list[dict]:
    references = [
        ("Amazonia", -13, -62, True, False), ("Sahara", 25, 15, True, False),
        ("Australia", -25, 130, True, False), ("India", 23, 79, True, False),
        ("Greenland interior", 72, -42, True, True), ("Antarctic interior", -85, 20, True, True),
        ("Arctic Ocean", 88, 0, False, False), ("Pacific", 0, -140, False, False),
        ("Atlantic", 0, -30, False, False), ("Indian Ocean", -20, 80, False, False),
        ("Pacific west seam", 0, -179.9, False, False), ("Pacific east seam", 0, 179.9, False, False),
    ]
    report = []
    for name, lat, lng, expected_land, expected_ice in references:
        actual_land = water_at(land, lat, lng) > 0
        actual_ice = water_at(ice, lat, lng) > 0
        if actual_land != expected_land or actual_ice != expected_ice:
            raise ValueError(f"Referencia geográfica incompatible: {name}: tierra={actual_land}, hielo={actual_ice}")
        flag = coverage_flag(lat, lng, water, land, forbidden, ice, water_at)
        expected_flag = "0" if not expected_land else "1" if expected_ice else "3"
        if flag != expected_flag:
            raise ValueError(f"La guarda de huella falló en {name}: {flag} != {expected_flag}")
        report.append({"name": name, "latitude": lat, "longitude": lng, "flag": flag})
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verifica sin reescribir el archivo generado")
    args = parser.parse_args()
    if hashlib.sha256(MASK.read_bytes()).hexdigest() != WATER_HASH:
        raise ValueError("La máscara NASA local cambió; revisar antes de regenerar cobertura")
    helpers = regional_helpers()
    with Image.open(MASK) as original:
        if original.mode != "L" or original.size != (2048, 1024):
            raise ValueError("Máscara NASA inesperada")
        water = original.copy()
    land = rasterize(verified_source("ne_50m_land.geojson"), water.size)
    ice = rasterize(verified_source("ne_50m_glaciated_areas.geojson"), water.size)
    # NE impide convertir 0=sin datos MODIS en tierra sobre el océano polar.
    forbidden = ImageChops.lighter(ImageChops.invert(land), helpers.ocean_reference(water))
    references = validate_references(water, land, ice, forbidden, helpers.water_at)
    centers = fibonacci_centers()
    flags = "".join(coverage_flag(lat, lng, water, land, forbidden, ice, helpers.water_at) for lat, lng in centers)
    layout = "\n".join(f"{index},{lat:.8f},{lng:.8f}" for index, (lat, lng) in enumerate(centers))
    metadata = {
        "count": COUNT, "resolutionDegrees": RESOLUTION, "goldenAngleDegrees": GOLDEN_ANGLE,
        "landCells": flags.count("1") + flags.count("3"), "vegetationCells": flags.count("3"),
        "glaciatedLandCells": flags.count("1"), "waterOrRejectedCells": flags.count("0"),
        "layoutSha256": hashlib.sha256(layout.encode("utf-8")).hexdigest(),
        "flagsSha256": hashlib.sha256(flags.encode("ascii")).hexdigest(),
        "maskSha256": WATER_HASH, "landSha256": SOURCES["ne_50m_land.geojson"],
        "glaciatedSha256": SOURCES["ne_50m_glaciated_areas.geojson"],
        "footprintRadiusFactor": FOOTPRINT_RADIUS_FACTOR, "coastalBufferDegrees": COASTAL_BUFFER,
        "maxInlandWaterFraction": MAX_INLAND_WATER_FRACTION,
    }
    chunks = [flags[index:index + 128] for index in range(0, len(flags), 128)]
    content = (
        "// Generado por scripts/build-global-hex-demo.py; no editar manualmente.\n"
        "// Escenario ficticio: 0=agua/huella rechazada; 1=tierra con hielo; 3=tierra sin hielo cartografiado.\n"
        "export const HEX_GLOBAL_COVERAGE = " + json.dumps(metadata, indent=2) + " as const;\n\n"
        "export const HEX_GLOBAL_FLAGS =\n  " + " +\n  ".join(f"'{chunk}'" for chunk in chunks) + ";\n"
    )
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            raise ValueError("Cobertura global desactualizada; ejecutar build-global-hex-demo.py")
    else:
        OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(json.dumps({"result": "PASS", "mode": "check" if args.check else "generate", **metadata,
                      "references": references}, indent=2))


if __name__ == "__main__":
    main()
