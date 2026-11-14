"""OCO-2 XCO2 (NASA GIBS layer) to the CSV consumed by the ETL normalizer.

Why GIBS: OCO-2 XCO2 (GES DISC product OCO2_L2_Lite_FP) requires an Earthdata account.
GIBS, NASA's open imagery service, renders those same soundings day by day using an
official palette that maps each color to a 0.4 ppm bin: values are recovered within that width.

Why WMS instead of tiles: OCO-2 measures a swath roughly 10 km wide. At tile pyramid level 2
(0.14° per pixel) only about 1,500 pixels have data per day; requesting the whole globe
from WMS at 0.07° yields about 6,000, in a single request per day instead of fifteen.

What it does with the data, and why:
  * Each colored pixel is a sounding. There is no "area coverage" as in a continuous map,
    so the 50% cell-area rule does not apply here.
  * Produces ONE mean per cell and year, not one per month. Measured: requiring 10 soundings per
    cell and month and 9 months per year (the rule for monthly variables) leaves only about 158
    cells out of 16,200 with a complete series, because the swath does not fill a 2° cell every month.
  * A cell's annual value is the mean of its monthly means, so a month with many soundings does not
    outweigh another: CO₂ has a seasonal cycle and a direct mean of soundings would bias toward summer.
    A month counts with MIN_SAMPLES or more soundings; a year, with MIN_MONTHS or more months.
  * The two open-ended palette classes (below 380 ppm and 480 ppm or above) have no recoverable value:
    they are discarded and counted in the manifest.
  * Only days declared by GIBS in its catalog are requested; days without data are neither requested
    nor imputed.
  * Leaves the anomaly column empty: XCO2 is analyzed as concentration, not as anomaly.

Requirements: pip install numpy pillow
Usage (from the repo root):
    python scripts/etl/gibs_oco2_to_csv.py
Output:
    data/nasa/raw/oco2_xco2.csv                  lat, lon, time (YYYY-01-01), value, anomaly
    backend/seed/oco2_xco2.provenance.json       provenance exposed by the API (versioned)
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

from power_grid import TARGET_DEGREES

LAYER = "OCO-2_Carbon_Dioxide_Total_Column_Average"
GIBS = "https://gibs.earthdata.nasa.gov"
CAPABILITIES_URL = GIBS + "/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml"
COLORMAP_URL = GIBS + "/colormaps/v1.3/OCO_Carbon_Dioxide_Total_Column_Average.xml"
WIDTH, HEIGHT = 5120, 2560  # 0.0703° per pixel: about 7.8 km at the equator, on the order of the swath width
WMS_URL = (GIBS + "/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=" + LAYER
           + "&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:4326&BBOX=-180,-90,180,90"
           + f"&WIDTH={WIDTH}&HEIGHT={HEIGHT}" + "&TIME={day}")
MIN_SAMPLES = 3  # minimum soundings to consider a cell measured in a month
MIN_MONTHS = 6  # minimum measured months to consider a cell's year measured
MAX_UNKNOWN_SHARE = 1e-4  # tolerated share of pixels with an off-palette color before aborting
# Title, version, and identifier as declared by GIBS in the layer metadata
# (layer-metadata/v1.0): no unverified authors or years are added.
CITATION = ("OCO-2 Level 2 bias-corrected XCO2 and other select fields from the full-physics retrieval "
            "aggregated as daily files, Retrospective processing V11.2r (OCO2_L2_Lite_FP). NASA GES DISC, "
            "concept id C2912085112-GES_DISC. Imagery served by NASA Global Imagery Browse Services (GIBS), "
            "ESDIS.")


def fetch(url: str, path: Path) -> bytes:
    """Download with disk cache: re-running the script skips what is already cached."""
    if path.exists() and path.stat().st_size:
        return path.read_bytes()
    with urllib.request.urlopen(url, timeout=180) as response:
        data = response.read()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def published_days(cache: Path, first: dt.date, last: dt.date) -> list[dt.date]:
    """Days declared in the GIBS catalog for the layer, clipped to the requested period."""
    xml = fetch(CAPABILITIES_URL, cache / "WMTSCapabilities.xml").decode("utf-8", errors="replace")
    layer = next(block for block in re.findall(r"<Layer>.*?</Layer>", xml, flags=re.S)
                 if f"<ows:Identifier>{LAYER}</ows:Identifier>" in block)
    days: set[dt.date] = set()
    for start, end, period in re.findall(r"<Value>([\d-]+)/([\d-]+)/(P\w+)</Value>", layer):
        if period != "P1D":
            raise SystemExit(f"The layer is no longer daily ({period}): review the script before continuing.")
        day, stop = dt.date.fromisoformat(start), dt.date.fromisoformat(end)
        while day <= stop:
            if first <= day <= last:
                days.add(day)
            day += dt.timedelta(days=1)
    return sorted(days)


def color_table(cache: Path) -> tuple[np.ndarray, np.ndarray]:
    """Lookup table color -> ppm (bin midpoint) and mask of open-ended class colors."""
    xml = fetch(COLORMAP_URL, cache / "OCO_Carbon_Dioxide_Total_Column_Average.xml").decode("utf-8")
    table = np.full(1 << 24, np.nan, dtype="float32")
    open_ended = np.zeros(1 << 24, dtype=bool)
    for entry in re.findall(r"<ColorMapEntry\b[^>]*>", xml):
        attributes = dict(re.findall(r'(\w+)="([^"]*)"', entry))
        if attributes.get("transparent") == "true" or attributes.get("nodata") == "true":
            continue
        low, high = attributes["value"].strip("[]()").split(",")
        red, green, blue = (int(x) for x in attributes["rgb"].split(","))
        packed = (red << 16) | (green << 8) | blue
        if "INF" in low or "INF" in high:
            open_ended[packed] = True
        else:
            table[packed] = (float(low) + float(high)) / 2
    return table, open_ended


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--first", default="2015-01-01",
                        help="first day (YYYY-MM-DD). The layer starts on 2014-09-06: 2014 is less than a full year")
    parser.add_argument("--last", default="2025-12-31", help="last day; closed on a full year")
    parser.add_argument("--cache", type=Path, default=Path("data/nasa/raw/gibs_oco2"))
    parser.add_argument("--output", type=Path, default=Path("data/nasa/raw/oco2_xco2.csv"))
    parser.add_argument("--manifest", type=Path, default=Path("backend/seed/oco2_xco2.provenance.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    days = published_days(args.cache, dt.date.fromisoformat(args.first), dt.date.fromisoformat(args.last))
    table, open_ended = color_table(args.cache)
    paths = {day: args.cache / f"{day.year}" / f"{day.isoformat()}.png" for day in days}
    # Download everything in parallel first (cached to disk); then process day by day in order.
    with ThreadPoolExecutor(args.workers) as pool:
        list(pool.map(lambda day: fetch(WMS_URL.format(day=day.isoformat()), paths[day]), days))

    # 2° cell for each pixel, by its center position (north is in the first row).
    n_lat, n_lon = round(180 / TARGET_DEGREES), round(360 / TARGET_DEGREES)
    pixel = 180 / HEIGHT
    lat_cell = ((180 - (np.arange(HEIGHT) + 0.5) * pixel) // TARGET_DEGREES).astype(int)
    lon_cell = (((np.arange(WIDTH) + 0.5) * pixel) // TARGET_DEGREES).astype(int)
    cell = (lat_cell[:, None] * n_lon + lon_cell[None, :]).ravel()
    centers_lat = np.arange(-90 + TARGET_DEGREES / 2, 90, TARGET_DEGREES)
    centers_lon = np.arange(-180 + TARGET_DEGREES / 2, 180, TARGET_DEGREES)

    digest = hashlib.sha256()
    months: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    soundings = discarded = unknown = 0
    strangers: dict[int, int] = {}
    for day in days:
        data = paths[day].read_bytes()
        digest.update(data)
        # Only look at colored pixels (a few thousand out of 13 million): converting the entire image
        # takes more than ten times as long.
        rgba = np.asarray(Image.open(io.BytesIO(data)).convert("RGBA")).reshape(-1, 4)
        visible = np.flatnonzero(rgba[:, 3])
        color = rgba[visible, :3].astype("uint32")
        packed = (color[:, 0] << 16) | (color[:, 1] << 8) | color[:, 2]
        value = table[packed]
        valid = np.isfinite(value)
        discarded += int(open_ended[packed].sum())
        odd = packed[~valid & ~open_ended[packed]]
        unknown += len(odd)
        for color in odd.tolist():
            strangers[color] = strangers.get(color, 0) + 1
        soundings += int(valid.sum())
        total, count = months.setdefault(day.strftime("%Y-%m"), (np.zeros(n_lat * n_lon), np.zeros(n_lat * n_lon)))
        total += np.bincount(cell[visible[valid]], weights=value[valid], minlength=n_lat * n_lon)
        count += np.bincount(cell[visible[valid]], minlength=n_lat * n_lon)
    # A few stray pixels with an off-palette color are discarded and counted. If there are many,
    # WMS would be blending colors when downsampling and no value could be trusted: abort in that case.
    if unknown > MAX_UNKNOWN_SHARE * soundings:
        raise SystemExit(f"{unknown} pixels with an off-palette color: WMS is blending colors.")
    if strangers:
        top = sorted(strangers.items(), key=lambda item: -item[1])[:5]
        print("off-palette colors (RGB: pixels):",
              ", ".join(f"{c >> 16},{(c >> 8) & 255},{c & 255}: {n}" for c, n in top))

    # Annual mean = mean of monthly means with enough soundings.
    years = sorted({month[:4] for month in months})
    annual: dict[str, np.ndarray] = {}
    for year in years:
        monthly = np.array([np.where(count >= MIN_SAMPLES, total / np.maximum(count, 1), np.nan)
                            for month, (total, count) in sorted(months.items()) if month.startswith(year)])
        measured = np.isfinite(monthly).sum(axis=0)
        annual[year] = np.where(measured >= MIN_MONTHS, np.nansum(monthly, axis=0) / np.maximum(measured, 1), np.nan)

    rows = 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["lat", "lon", "time", "value", "anomaly"])
        for year in years:
            for index in np.nonzero(np.isfinite(annual[year]))[0]:
                writer.writerow([f"{centers_lat[index // n_lon]:.1f}", f"{centers_lon[index % n_lon]:.1f}",
                                 f"{year}-01-01", f"{annual[year][index]:.2f}", ""])
                rows += 1

    used = sorted(months)
    manifest = {
        "variable": "Oco2", "provider": "nasa-gibs-oco2",
        "product": "OCO-2 · XCO₂, column average (NASA GIBS " + LAYER + " layer, annual cell mean)",
        "baseline": None, "unit": "ppm", "trendUnit": "ppm / year", "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": WMS_URL.format(day="{YYYY-MM-DD}"),
        "sourceFile": f"{LAYER}, WMS {WIDTH}x{HEIGHT}, {len(days)} days",
        # SHA-256 of the daily PNG images, concatenated in date order.
        "sourceSha256": digest.hexdigest(),
        "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "coverageStart": int(years[0]), "coverageEnd": int(years[-1]), "lastMonth": used[-1], "rows": rows,
        "processing": f"XCO₂ recovered from the daily image using the official GIBS palette (0.4 ppm bins): "
                      f"{soundings} soundings across {len(days)} days. Annual mean per 2° cell = mean of its monthly "
                      f"means; a month requires {MIN_SAMPLES} or more soundings and a year requires {MIN_MONTHS} or "
                      f"more months. Soundings outside the palette range (below 380 ppm or 480 ppm and above), "
                      f"discarded: {discarded}. Pixels with an off-palette color, discarded: {unknown}.",
        "citation": CITATION,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{rows} rows | {years[0]} to {years[-1]} ({len(used)} months, {len(days)} days) | {soundings} soundings | "
          f"discarded {discarded} | cells per year: {[int(np.isfinite(annual[y]).sum()) for y in years]} | {args.output}")


if __name__ == "__main__":
    main()
