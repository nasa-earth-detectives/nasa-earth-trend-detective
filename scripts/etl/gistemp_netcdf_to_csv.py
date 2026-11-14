"""Converts GISTEMP v4 netCDF to the CSV consumed by the ETL normalizer.

Rationale: the normalizer (`SpatialGridNormalizer`) reads CSV via DuckDB, but GISTEMP is only
published as gridded netCDF. This step is the only source-specific component: when the
team receives another official source, a converter producing the same CSV and
manifest suffices; neither the API nor frontend changes.

Usage (from repository root):
    python scripts/etl/gistemp_netcdf_to_csv.py \
        --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000

Output:
    data/nasa/raw/gistemp_v4.csv              lat, lon, time (YYYY-MM-01), value, anomaly
    backend/seed/gistemp_v4.provenance.json   provenance exposed by the API (versioned)
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import gzip
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import netcdf_file

SOURCE_URL = "https://data.giss.nasa.gov/pub/gistemp/gistemp1200_GHCNv4_ERSSTv5.nc.gz"
EPOCH = dt.date(1800, 1, 1)  # file units: "days since 1800-01-01"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def open_netcdf(source: Path) -> tuple[netcdf_file, Path | None]:
    """scipy does not read .gz: decompressed to a temporary file deleted upon completion."""
    if source.suffix != ".gz":
        return netcdf_file(source, "r", mmap=False), None
    descriptor, name = tempfile.mkstemp(suffix=".nc")
    os.close(descriptor)  # On Windows an open descriptor prevents deleting the temp file
    tmp = Path(name)
    with gzip.open(source, "rb") as packed, tmp.open("wb") as plain:
        shutil.copyfileobj(packed, plain)
    return netcdf_file(tmp, "r", mmap=False), tmp


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("data/nasa/raw/gistemp_v4.csv"))
    parser.add_argument("--manifest", type=Path,
                        default=Path("backend/seed/gistemp_v4.provenance.json"))
    parser.add_argument("--start-year", type=int, default=2000)
    args = parser.parse_args()

    nc, tmp = open_netcdf(args.source)
    try:
        lat = nc.variables["lat"].data.astype(float)
        lon = nc.variables["lon"].data.astype(float)
        days = nc.variables["time"].data.astype(int)
        field = nc.variables["tempanomaly"]
        scale = float(field._attributes["scale_factor"])
        fill = int(field._attributes["_FillValue"])
        raw = field.data  # (time, lat, lon) int16

        months = [EPOCH + dt.timedelta(days=int(d)) for d in days]
        keep = [i for i, m in enumerate(months) if m.year >= args.start_year]
        if not keep:
            raise SystemExit(f"No months from {args.start_year} found in file.")

        lon_grid, lat_grid = np.meshgrid(lon, lat)
        lat_flat, lon_flat = lat_grid.ravel(), lon_grid.ravel()
        args.output.parent.mkdir(parents=True, exist_ok=True)
        rows = 0
        with args.output.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["lat", "lon", "time", "value", "anomaly"])
            for index in keep:
                stamp = f"{months[index].year:04d}-{months[index].month:02d}-01"
                values = raw[index].ravel()
                valid = values != fill  # missing data: neither fabricated nor imputed here
                anomaly = np.round(values[valid].astype(float) * scale, 2)
                for la, lo, a in zip(lat_flat[valid], lon_flat[valid], anomaly):
                    # GISTEMP only publishes anomalies (°C relative to 1951-1980): value = anomaly.
                    writer.writerow([f"{la:.1f}", f"{lo:.1f}", stamp, f"{a:.2f}", f"{a:.2f}"])
                rows += int(valid.sum())

        first, last = months[keep[0]], months[keep[-1]]
        manifest = {
            "variable": "Gistemp",
            "provider": "nasa-giss-gistemp-v4",
            "product": "GISTEMP v4 · anomalía de temperatura tierra-océano (GHCNv4 + ERSSTv5, 1200 km)",
            "baseline": "1951-1980",
            "unit": "°C Anomaly",
            # The API reports Sen's slope per year: the trend unit travels with the
            # dataset so another source (different unit or time base) requires no code changes.
            "trendUnit": "°C / año",
            # Public GISTEMP download while the challenge provides its official source: the UI
            # displays it as an interim source and it is replaced with another manifest + Parquet.
            "interim": True,
            "resolutionDegrees": float(abs(lat[1] - lat[0])),
            "sourceUrl": SOURCE_URL,
            "sourceFile": args.source.name,
            "sourceSha256": sha256(args.source),
            "retrievedAt": dt.datetime.fromtimestamp(args.source.stat().st_mtime, dt.timezone.utc)
                .isoformat(timespec="seconds"),
            "coverageStart": first.year,
            "coverageEnd": last.year,
            "lastMonth": f"{last.year:04d}-{last.month:02d}",
            "rows": rows,
            "citation": "GISTEMP Team: GISS Surface Temperature Analysis (GISTEMP), version 4. "
                        "NASA Goddard Institute for Space Studies. https://data.giss.nasa.gov/gistemp/",
        }
        args.manifest.parent.mkdir(parents=True, exist_ok=True)
        args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"{rows} rows | {first:%Y-%m} to {last:%Y-%m} | {args.output}")
        print(f"manifest: {args.manifest}")
        print("next step: dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- "
              f"normalize --source {args.output} --variable Gistemp --output {args.manifest.name.split('.')[0]}.parquet")
    finally:
        nc.close()
        if tmp is not None:
            tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
