"""Monthly MODIS Terra NDVI (NASA GIBS layer) to the CSV consumed by the ETL normalizer.

Why via GIBS: MODIS NDVI is only published in 1 km tiles that require an account, and requesting it
point-by-point from AppEEARS for the entire globe takes days (measured: 23 minutes per 1% of a task).
GIBS, NASA's open imagery service, serves the same monthly product (L3, MODIS, Terra) as PNG tiles
without an account. Each image is rendered using an official palette that maps every color to an NDVI
interval, so the value is recovered accurately within that interval width.

What it does with the data, and why:
  * Downloads level 2 of the tile pyramid (15 tiles per month, 0.14° per pixel): roughly 200 pixels per
    2° cell, enough to average without downloading the full product.
  * Maps each color to the midpoint of its interval (142 classes, from 0.005 to 0.01 wide).
  * Transparent pixels (water, no data, or NDVI <= 0) are excluded from the average.
  * A cell with less than half of its area covered is omitted (no row): nothing is invented or imputed.
  * Leaves the anomaly column empty: NDVI is analyzed as an index, not as an anomaly.

Requirements: pip install numpy pillow
Usage (from repo root):
    python scripts/etl/gibs_ndvi_to_csv.py
Output:
    data/nasa/raw/modis_ndvi.csv                 lat, lon, time (YYYY-MM-01), value, anomaly
    backend/seed/modis_ndvi.provenance.json      provenance exposed by the API (versioned)
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
DEGREES_PER_PIXEL = 0.5625 / 2 ** LEVEL  # level 0 of the GIBS geographic pyramid is 0.5625° per pixel
VALID_ROWS = round(180 / DEGREES_PER_PIXEL)  # the bottom tile row extends past the South Pole
CITATION = ("Didan, K. (2021). MODIS/Terra Vegetation Indices Monthly L3 Global 1km SIN Grid V061. NASA EOSDIS "
            "Land Processes DAAC. doi:10.5067/MODIS/MOD13A3.061. Imagery served by NASA Global Imagery Browse "
            "Services (GIBS), ESDIS.")


def fetch(url: str, path: Path) -> bytes | None:
    """Download with on-disk cache. A month not published by GIBS (404) is recorded as an empty file."""
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
    """Color -> NDVI lookup table indexed by 24-bit packed RGB. NaN = color without value."""
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
    """Monthly NDVI mosaic (latitude north to south), or None if GIBS does not have that month."""
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
    parser.add_argument("--first", default="2000-03", help="first month (YYYY-MM); GIBS starts at 2000-03")
    parser.add_argument("--last", default="2025-12", help="last month; closes on a full year")
    parser.add_argument("--cache", type=Path, default=Path("data/nasa/raw/gibs_ndvi"))
    parser.add_argument("--output", type=Path, default=Path("data/nasa/raw/modis_ndvi.csv"))
    parser.add_argument("--manifest", type=Path, default=Path("backend/seed/modis_ndvi.provenance.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    first, last = (dt.date.fromisoformat(f"{text}-01") for text in (args.first, args.last))
    months = [f"{year:04d}-{month:02d}" for year in range(first.year, last.year + 1) for month in range(1, 13)
              if first <= dt.date(year, month, 1) <= last]
    table = color_table(args.cache)
    # Download everything in parallel first (cached on disk); then process month by month in order.
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
        "product": "MODIS Terra L3 · monthly NDVI (NASA GIBS MODIS_Terra_L3_NDVI_Monthly layer, cell mean)",
        "baseline": None, "unit": "NDVI", "trendUnit": "NDVI / year", "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": TILE_URL.format(month="{YYYY-MM}", level=LEVEL, row="{row}", col="{col}"),
        "sourceFile": f"{LAYER}, level {LEVEL}, {len(used)} months",
        # SHA-256 of the PNG tiles, concatenated by month, row, and column.
        "sourceSha256": digest.hexdigest(),
        "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "coverageStart": int(used[0][:4]), "coverageEnd": int(used[-1][:4]), "lastMonth": used[-1], "rows": rows,
        "processing": "NDVI recovered from the image using the official GIBS palette (142 classes from 0.005 to 0.01 "
                      "wide) and area-averaged to 2°. Transparent pixels (water, no data, or NDVI less than or "
                      f"equal to 0) are excluded. Months not published by GIBS: {', '.join(missing) or 'none'}.",
        "citation": CITATION,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{rows} rows | {used[0]} to {used[-1]} ({len(used)} months) | unpublished: {missing or 'none'} | {args.output}")


if __name__ == "__main__":
    main()
