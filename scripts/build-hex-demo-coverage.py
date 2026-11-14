"""Classifies regional demo footprints offline; uses Pillow already used by Earth assets.

python scripts/build-hex-demo-coverage.py
python scripts/build-hex-demo-coverage.py --check

Does not download data or transform mask: outputs synthetic scenario IDs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "frontend/src/services/demo/hexDemoData.ts"
MASK = ROOT / "frontend/public/earth/masks/modis-water-2k.png"
MANIFEST = ROOT / "docs/obsidian/earth-assets/asset-manifest.json"
OUTPUT = ROOT / "frontend/src/services/demo/hexDemoCoverage.ts"
FOOTPRINT_RADIUS_FACTOR = 0.34
COASTAL_BUFFER_DEGREES = 0.30
MAX_INLAND_WATER_FRACTION = 0.08

# Known interior points. Verify north-is-up, longitude sign, and semantics.
LANDMARKS = [
    ("South America", -13, -62, 0), ("Sahara", 25, 15, 0),
    ("Australia", -25, 130, 0), ("India", 23, 79, 0),
    ("Greenland", 72, -42, 0), ("Pacific", 0, -140, 255),
    ("Atlantic", 0, -30, 255), ("Indian Ocean", -20, 80, 255),
]


def project(latitude: float, longitude: float, east: float, north: float) -> tuple[float, float]:
    distance = math.radians(math.hypot(east, north))
    if distance == 0:
        return latitude, longitude
    bearing, lat = math.atan2(east, north), math.radians(latitude)
    next_lat = math.asin(math.sin(lat) * math.cos(distance)
                         + math.cos(lat) * math.sin(distance) * math.cos(bearing))
    next_lng = math.radians(longitude) + math.atan2(
        math.sin(bearing) * math.sin(distance) * math.cos(lat),
        math.cos(distance) - math.sin(lat) * math.sin(next_lat),
    )
    return math.degrees(next_lat), (math.degrees(next_lng) + 540) % 360 - 180


def regional_locations() -> tuple[list[dict], float]:
    """Reads constants from the actual generator; fails if structure changes instead of guessing."""
    source = DEMO.read_text(encoding="utf-8")
    resolution_match = re.search(r"DEMO_HEX_RESOLUTION_DEGREES = ([\d.]+);", source)
    radius_match = re.search(r"PATCH_RADIUS = (\d+);", source)
    regions_match = re.search(r"const REGIONS = \[(.*?)\] as const;", source, re.S)
    if not resolution_match or not radius_match or not regions_match:
        raise ValueError("Demo generator structure changed; review geometry reader")
    resolution, radius = float(resolution_match[1]), int(radius_match[1])
    regions = re.findall(r"\{ id: '([^']+)', latitude: (-?[\d.]+), longitude: (-?[\d.]+) \}", regions_match[1])
    if len(regions) != 8:
        raise ValueError("Expected eight demo regions; review coverage")
    locations = []
    for region, latitude, longitude in regions:
        for q in range(-radius, radius + 1):
            for r in range(-radius, radius + 1):
                if abs(q + r) > radius:
                    continue
                lat, lng = project(float(latitude), float(longitude),
                                   resolution * (q + r / 2), resolution * math.sqrt(3) / 2 * r)
                locations.append({"id": f"demo:{region}:{q}:{r}", "latitude": lat,
                                  "longitude": lng, "region": region})
    return locations, resolution


def water_at(image: Image.Image, latitude: float, longitude: float) -> int:
    x = math.floor((longitude + 180) / 360 * image.width) % image.width
    y = max(0, min(image.height - 1, math.floor((90 - latitude) / 180 * image.height)))
    return image.getpixel((x, y))


def ocean_reference(image: Image.Image) -> Image.Image:
    """Separates connected ocean from small rivers/lakes; purely a demo visual guard."""
    connected = image.point(lambda value: 255 if value >= 128 else 0)
    for lng in (-140, -30, 80):
        seed = (math.floor((lng + 180) / 360 * image.width), image.height // 2)
        if connected.getpixel(seed) == 255:
            ImageDraw.floodfill(connected, seed, 128)
    # Expands by one pixel: includes coastal edges with partial coverage from BOX averaging.
    return connected.point(lambda value: 255 if value == 128 else 0).filter(ImageFilter.MaxFilter(3))


def footprint_has_water(image: Image.Image, ocean: Image.Image, location: dict, radius: float) -> bool:
    """Examines every pixel that can intersect the circumscribed circle and its margin."""
    lat, lng = location["latitude"], location["longitude"]
    if water_at(image, lat, lng) > 0:
        return True
    # Maximum pixel half-diagonal: exaggerated towards poles, conservative.
    pixel_guard = math.hypot(360 / image.width, 180 / image.height) / 2
    checked_radius = radius + pixel_guard
    max_lat = min(89.9, abs(lat) + checked_radius)
    longitude_radius = checked_radius / math.cos(math.radians(max_lat))
    left = math.floor((lng - longitude_radius + 180) / 360 * image.width)
    right = math.ceil((lng + longitude_radius + 180) / 360 * image.width)
    top = max(0, math.floor((90 - lat - checked_radius) / 180 * image.height))
    bottom = min(image.height - 1, math.ceil((90 - lat + checked_radius) / 180 * image.height))
    limit = math.sin(math.radians(checked_radius) / 2) ** 2
    lat_rad = math.radians(lat)
    pixels, ocean_pixels = image.load(), ocean.load()
    water_sum = 0
    sample_count = 0
    for y in range(top, bottom + 1):
        pixel_lat = math.radians(90 - (y + 0.5) / image.height * 180)
        for x in range(left, right + 1):
            pixel_lng = (x + 0.5) / image.width * 360 - 180
            haversine = math.sin((pixel_lat - lat_rad) / 2) ** 2 + math.cos(lat_rad) \
                * math.cos(pixel_lat) * math.sin(math.radians(pixel_lng - lng) / 2) ** 2
            if haversine <= limit:
                if ocean_pixels[x % image.width, y] > 0:
                    return True
                water_sum += pixels[x % image.width, y] / 255
                sample_count += 1
    return sample_count == 0 or water_sum / sample_count > MAX_INLAND_WATER_FRACTION


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verifies existing file without writing")
    args = parser.parse_args()
    digest = hashlib.sha256(MASK.read_bytes()).hexdigest()
    expected = json.loads(MANIFEST.read_text(encoding="utf-8"))["outputs"]["masks/modis-water-2k.png"]["sha256"]
    if digest != expected:
        raise ValueError("Mask changed relative to local NASA manifest; review before generating")
    locations, resolution = regional_locations()
    footprint_radius = resolution * FOOTPRINT_RADIUS_FACTOR
    with Image.open(MASK) as image:
        if image.mode != "L" or image.size != (2048, 1024):
            raise ValueError("Unexpected local mask: requires L 2048x1024")
        for name, lat, lng, expected_value in LANDMARKS:
            actual = water_at(image, lat, lng)
            if actual != expected_value:
                raise ValueError(f"Incompatible orientation/semantics at {name}: {actual} != {expected_value}")
        ocean = ocean_reference(image)
        for name, lat, lng, expected_value in LANDMARKS:
            if water_at(ocean, lat, lng) != expected_value:
                raise ValueError(f"Ocean guard lost its reference at {name}")
        accepted = [cell for cell in locations if not footprint_has_water(
            image, ocean, cell, footprint_radius + COASTAL_BUFFER_DEGREES)]
    # Hash verifies that Python and the JS generator retain exactly identical centers.
    layout = "\n".join(f'{cell["id"]},{cell["latitude"]:.8f},{cell["longitude"]:.8f}' for cell in locations)
    metadata = {
        "maskSha256": digest,
        "regionalLayoutSha256": hashlib.sha256(layout.encode("utf-8")).hexdigest(),
        "regionalCells": len(locations), "landCells": len(accepted),
        "vegetationCells": sum(cell["region"] != "greenland" for cell in accepted),
        "footprintRadiusFactor": FOOTPRINT_RADIUS_FACTOR,
        "coastalBufferDegrees": COASTAL_BUFFER_DEGREES,
        "maxCenterWaterCoverage": 0,
        "maxOceanCoverage": 0,
        "maxInlandWaterFraction": MAX_INLAND_WATER_FRACTION,
    }
    content = (
        "// Generated by scripts/build-hex-demo-coverage.py; do not edit manually.\n"
        "// Visual filter for the mock scenario. 0 in the mask may also represent missing data.\n"
        "export const HEX_DEMO_COVERAGE = " + json.dumps(metadata, indent=2) + " as const;\n\n"
        "export const DEMO_LAND_CELL_IDS = [\n"
        + "".join("  " + ", ".join(f"'{cell['id']}'" for cell in accepted[index:index + 3]) + ",\n"
                  for index in range(0, len(accepted), 3))
        + "] as const;\n"
    )
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            raise ValueError("Coverage outdated; run build-hex-demo-coverage.py")
    else:
        OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(json.dumps({"result": "PASS", "mode": "check" if args.check else "generate", **metadata,
                      "acceptedByRegion": dict(Counter(cell["region"] for cell in accepted)),
                      "orientationLandmarks": len(LANDMARKS)}, indent=2))


if __name__ == "__main__":
    main()
