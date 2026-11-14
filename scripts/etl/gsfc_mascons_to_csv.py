"""GRACE and GRACE-FO mascons (NASA GSFC) to the CSV consumed by the ETL normalizer.

Why this source: the JPL mascons distributed by PO.DAAC require an Earthdata account, and the
NASA GIBS GRACE layer saturates at ±30 cm (measured: a third of land mascons exceed that value
in some month, right where the signal is: Greenland, Antarctica, Alaska). NASA Goddard's Geodesy
and Geophysics Laboratory publishes its full solution without an account as plain text: 41,168
equal-area 1° mascons with a monthly value in centimeters of equivalent water height.

What it does with the data, and why:
  * Keeps land and grounded-ice mascons (Greenland, Antarctica, Gulf of Alaska glaciers, and
    remaining land). Ocean mascons measure bottom pressure and ice shelves float: they represent
    a different quantity and the product layer is "land water and ice".
  * Each mascon is a latitude-longitude rectangle. It is distributed onto the 2° GISTEMP grid by
    overlap area on the sphere; a cell with less than half of its area on land is omitted.
  * Each solution is assigned to the month of its midpoint day. Months without a solution (gap
    between GRACE and GRACE-FO, battery shutdowns) are not imputed.
  * value and anomaly carry the same value: the product is already an anomaly relative to the
    2004-2009 mean.

Requirements: pip install numpy
Usage (from the repo root):
    python scripts/etl/gsfc_mascons_to_csv.py
Output:
    data/nasa/raw/grace_mascons.csv              lat, lon, time (YYYY-MM-01), value, anomaly
    backend/seed/grace_mascons.provenance.json   provenance exposed by the API (versioned)
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import urllib.request
import zipfile
from pathlib import Path

import numpy as np

from power_grid import MIN_COVERAGE, TARGET_DEGREES

PRODUCT = "GSFC.glb.200204_202606_RL06v2.0_OBP-ICE6GD"
SOURCE_URL = "https://earth.gsfc.nasa.gov/sites/default/files/geo/GSFC.glb_.200204_202606_RL06v2.0_OBP-ICE6GD.zip"
LAND_LOCATIONS = (1, 3, 5, 80)  # Greenland, Antarctica, Gulf of Alaska, and land; excludes ocean (90) and ice shelves (4)
CITATION = ("Loomis, B. D., Luthcke, S. B., Sabaka, T. J. (2019). Regularization and error characterization of GRACE "
            "mascons. Journal of Geodesy, 93, 1381-1398. doi:10.1007/s00190-019-01252-y. RL06v2.0 "
            "(OBP-ICE6GD) solution from NASA Goddard Space Flight Center, Geodesy and Geophysics Laboratory.")


def read_table(archive: zipfile.ZipFile, name: str) -> np.ndarray:
    """Numeric table from one of the text files: everything following the END OF HEADER line."""
    with archive.open(f"{PRODUCT}/{name}") as raw:
        handle = io.TextIOWrapper(raw, encoding="ascii", errors="replace")
        for line in handle:
            if line.startswith("END OF HEADER"):
                break
        return np.loadtxt(handle)


def overlaps(placement: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Overlap area (on the unit sphere) of each mascon with each 2° cell: cell, mascon, weight."""
    lat_edges = np.arange(-90, 90 + TARGET_DEGREES, TARGET_DEGREES)
    lon_edges = np.arange(-180, 180 + TARGET_DEGREES, TARGET_DEGREES)
    n_lon = len(lon_edges) - 1
    cells, mascons, weights = [], [], []
    for index, (lat, lon, d_lat, d_lon) in enumerate(placement[:, :4]):
        # The two polar mascons are centered on the pole: they form a cap of d_lat degrees, not half.
        south, north = lat - d_lat / 2, lat + d_lat / 2
        south, north = (90 - d_lat, 90.0) if north > 90 else (-90.0, -90 + d_lat) if south < -90 else (south, north)
        a = np.maximum(south, lat_edges[:-1])
        b = np.minimum(north, lat_edges[1:])
        band = np.where(b > a, np.sin(np.radians(b)) - np.sin(np.radians(a)), 0.0)
        # The file gives longitude from 0 to 360: test shifts to cover antimeridian crossings.
        width = np.zeros(n_lon)
        for shift in (-360.0, 0.0, 360.0):
            lo = np.maximum(lon - d_lon / 2 + shift, lon_edges[:-1])
            hi = np.minimum(lon + d_lon / 2 + shift, lon_edges[1:])
            width += np.clip(hi - lo, 0, None)
        for row in np.nonzero(band)[0]:
            for col in np.nonzero(width)[0]:
                cells.append(row * n_lon + col)
                mascons.append(index)
                weights.append(band[row] * np.radians(width[col]))
    return np.array(cells), np.array(mascons), np.array(weights)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--last", default="2025-12", help="last month (YYYY-MM); closed on a full year")
    parser.add_argument("--cache", type=Path, default=Path("data/nasa/raw/gsfc_mascons"))
    parser.add_argument("--output", type=Path, default=Path("data/nasa/raw/grace_mascons.csv"))
    parser.add_argument("--manifest", type=Path, default=Path("backend/seed/grace_mascons.provenance.json"))
    args = parser.parse_args()

    package = args.cache / SOURCE_URL.rsplit("/", 1)[1]
    if not package.exists():
        package.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(SOURCE_URL, timeout=600) as response:
            package.write_bytes(response.read())
    with zipfile.ZipFile(package) as archive:
        placement = read_table(archive, "Mascon_placement_file_gen6.txt")
        times = read_table(archive, "Time_file_200204_202606.txt")
        solution = read_table(archive, f"{PRODUCT}.txt")  # mascons x solutions, in cm equivalent water height

    months = [(dt.date(int(year), 1, 1) + dt.timedelta(days=float(day) - 1)).strftime("%Y-%m")
              for year, day in times[:, :2]]
    if len(set(months)) != len(months):
        raise SystemExit("Two solutions fall in the same month: decide how to combine them before continuing.")

    land = np.isin(placement[:, 6].astype(int), LAND_LOCATIONS)
    cells, mascons, weights = overlaps(placement[land])
    n_lat, n_lon = round(180 / TARGET_DEGREES), round(360 / TARGET_DEGREES)
    covered = np.bincount(cells, weights=weights, minlength=n_lat * n_lon)
    total = np.zeros((n_lat * n_lon, solution.shape[1]))
    np.add.at(total, cells, weights[:, None] * solution[land][mascons])

    # Distribution check: the area-weighted land mean must not change when regridding.
    area = placement[land, 5]
    before = (solution[land] * area[:, None]).sum(axis=0) / area.sum()
    after = total.sum(axis=0) / covered.sum()
    drift = float(np.abs(before - after).max())
    if drift > 0.05:
        raise SystemExit(f"Regridding changes the land mean by {drift:.3f} cm: check overlaps.")

    lat_edges = np.radians(np.arange(-90, 90 + TARGET_DEGREES, TARGET_DEGREES))
    full = np.repeat(np.diff(np.sin(lat_edges)) * np.radians(TARGET_DEGREES), n_lon)
    keep = covered >= MIN_COVERAGE * full
    grid = np.where(keep[:, None], total / np.where(covered > 0, covered, 1)[:, None], np.nan)

    centers_lat = np.arange(-90 + TARGET_DEGREES / 2, 90, TARGET_DEGREES)
    centers_lon = np.arange(-180 + TARGET_DEGREES / 2, 180, TARGET_DEGREES)
    used = [month for month in months if month <= args.last]
    rows = 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["lat", "lon", "time", "value", "anomaly"])
        for column, month in enumerate(months):
            if month > args.last:
                continue
            for index in np.nonzero(keep)[0]:
                value = f"{grid[index, column]:.2f}"
                writer.writerow([f"{centers_lat[index // n_lon]:.1f}", f"{centers_lon[index % n_lon]:.1f}",
                                 f"{month}-01", value, value])
                rows += 1

    manifest = {
        "variable": "GraceMass", "provider": "nasa-gsfc-grace-mascons",
        "product": "GRACE and GRACE-FO · NASA GSFC RL06v2.0 mascons (land water and ice, cm equivalent water height)",
        "baseline": "2004-2009", "unit": "cm EWH", "trendUnit": "cm EWH / year", "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": SOURCE_URL, "sourceFile": package.name,
        "sourceSha256": hashlib.sha256(package.read_bytes()).hexdigest(),
        "retrievedAt": dt.datetime.fromtimestamp(package.stat().st_mtime, dt.timezone.utc).isoformat(timespec="seconds"),
        "coverageStart": int(used[0][:4]), "coverageEnd": int(used[-1][:4]), "lastMonth": used[-1], "rows": rows,
        "processing": f"{int(land.sum())} land and grounded-ice mascons (out of {len(placement)}), distributed onto the "
                      f"2° grid by overlap area; cells with less than {MIN_COVERAGE:.0%} of their area on land "
                      f"are omitted. {len(used)} monthly solutions, each assigned to the month of its midpoint day; "
                      "missing months are not imputed. ICE-6G_D glacial isostatic adjustment correction included "
                      f"in the product. Land mean drifts at most {drift:.4f} cm upon regridding.",
        "citation": CITATION,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{rows} rows | {used[0]} to {used[-1]} ({len(used)} months) | {int(keep.sum())} cells | "
          f"min {np.nanmin(grid):.1f} max {np.nanmax(grid):.1f} cm | mean drift {drift:.5f} cm | {args.output}")


if __name__ == "__main__":
    main()
