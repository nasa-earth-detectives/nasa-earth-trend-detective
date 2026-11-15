"""Converts NASA POWER v10 annual means (MERRA-2 and GPM IMERG) to the CSV consumed by the ETL.

Why this exists: the challenge names MERRA-2 (model) and GPM (mission), and NASA POWER publishes both
datasets in an open bucket, with no account or token required. It follows the same path as GISTEMP: this
converter is the only source-specific piece; neither the API nor the frontend changes.

What it does with the data, and why:
  * Uses the ANNUAL mean already computed by POWER (does not average months here): one row per cell and year.
  * Regrids from the native resolution (0.5° x 0.625° for MERRA-2; 0.1° for IMERG) to the 2° GISTEMP grid,
    so all sources share the same cells. Overlap-area weighted average.
  * A 2° cell with less than half of its area covered is omitted (coastlines in land-only variables, or
    latitudes not covered by IMERG): nothing is invented or imputed.
  * anomaly = value - cell mean over the source baseline period. The slope is identical using value or
    anomaly; the anomaly makes single-year maps readable.

Requirements: pip install numpy numcodecs
Usage (from repo root):
    python scripts/etl/nasa_power_zarr_to_csv.py                    # all variables
    python scripts/etl/nasa_power_zarr_to_csv.py --variables IMERG_PRECTOT
Output, per variable:
    data/nasa/raw/<file>.csv                    lat, lon, time (YYYY-01-01), value, anomaly
    backend/seed/<file>.provenance.json         provenance exposed by the API (versioned)
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

import numpy as np

from power_grid import MIN_COVERAGE, TARGET_DEGREES, regrid, write_csv
from power_zarr import PowerZarr

POWER_CITATION = ("NASA POWER Project: NASA POWER Data v10. NASA Langley Research Center. "
                  "https://power.larc.nasa.gov/ (CC BY 4.0). ")
SOURCES = {
    "merra2": {
        "store": "merra2/temporal/power_merra2_annual_temporal_utc.zarr", "provider": "nasa-power-merra2",
        "name": "MERRA-2", "native": "0.5° x 0.625°", "baseline": (1991, 2020),
        "citation": POWER_CITATION + "Derived from MERRA-2: Gelaro et al. (2017), J. Climate 30, "
                    "5419-5454, doi:10.1175/JCLI-D-16-0758.1",
    },
    # IMERG starts in 1998: its baseline period cannot be MERRA-2's 1991-2020.
    "imerg": {
        "store": "imerg/temporal/power_imerg_annual_temporal_utc.zarr", "provider": "nasa-power-imerg",
        "name": "GPM IMERG", "native": "0.1°", "baseline": (2001, 2020),
        "citation": POWER_CITATION + "Derived from GPM IMERG (Integrated Multi-satellitE Retrievals "
                    "for GPM), NASA Goddard. POWER marks this parameter as 'reviewing'.",
    },
}
# POWER parameter -> (source, domain variable, file stem, unit, trend unit, product, decimals)
VARIABLES = {
    "T2M": ("merra2", "Merra2Temperature", "merra2_t2m", "°C", "°C / year", "2 m air temperature", 3),
    "PRECTOTCORR": ("merra2", "Merra2Precipitation", "merra2_precipitation", "mm/day", "mm/day / year",
                    "corrected total precipitation", 3),
    "EVLAND": ("merra2", "Merra2Evaporation", "merra2_evaporation", "mm/day", "mm/day / year",
               "land evaporation", 3),
    "GWETROOT": ("merra2", "Merra2SoilMoisture", "merra2_soil_moisture", "fraction", "fraction / year",
                 "root-zone soil moisture (0-1)", 4),
    "IMERG_PRECTOT": ("imerg", "GpmPrecipitation", "gpm_imerg_precipitation", "mm/day", "mm/day / year",
                      "satellite-estimated total precipitation", 3),
}


def convert(name: str, args: argparse.Namespace) -> None:
    source_key, variable, stem, unit, trend_unit, label, decimals = VARIABLES[name]
    source = SOURCES[source_key]
    zarr = PowerZarr(source["store"], args.cache / source_key, args.workers)
    lat, lon = zarr.axis("lat"), zarr.axis("lon")
    # Axis units are "days since YYYY-12-31": each step is December 31 of its year.
    origin = dt.date.fromisoformat(zarr.attrs("time")["units"].split("since ")[1][:10])
    years = np.array([(origin + dt.timedelta(days=int(d))).year for d in zarr.axis("time")])

    cube, source_sha, missing = zarr.read(name)
    complete = np.isfinite(cube).any(axis=(1, 2))  # the Zarr store pre-allocates future, still-empty years
    cube, kept = cube[complete], years[complete]
    grid = regrid(cube, lat, lon)

    first, last = source["baseline"]
    base = (kept >= first) & (kept <= last)
    if base.sum() != last - first + 1:
        raise SystemExit(f"{name}: baseline period {first}-{last} is incomplete in the source.")
    with np.errstate(invalid="ignore"):
        # Simple mean (not nanmean): a cell missing any baseline year gets no anomaly and no row.
        anomaly = grid - grid[base].mean(axis=0)

    output = args.output_dir / f"{stem}.csv"
    rows = write_csv(output, grid, anomaly, kept, decimals)
    manifest = {
        "variable": variable,
        "provider": source["provider"],
        "product": f"{source['name']} · {label} (NASA POWER v10, annual mean)",
        "baseline": f"{first}-{last}",
        "unit": unit,
        "trendUnit": trend_unit,
        # MERRA-2 and GPM are sources named by the challenge itself: they are not interim.
        "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": f"{zarr.url}/{name}",
        "sourceFile": f"{Path(source['store']).name}/{name}",
        # SHA-256 of the compressed array chunks, concatenated in (latitude, longitude) order.
        "sourceSha256": source_sha,
        "retrievedAt": dt.datetime.fromtimestamp(zarr.retrieved_at(name), dt.timezone.utc)
            .isoformat(timespec="seconds"),
        "coverageStart": int(kept[0]),
        "coverageEnd": int(kept[-1]),
        "lastMonth": f"{int(kept[-1]):04d}-12",
        "rows": rows,
        "processing": f"POWER annual mean regridded from {source['native']} to {TARGET_DEGREES:g}° using "
                      f"area-weighted averaging; cells with less than {round(MIN_COVERAGE * 100)} percent of "
                      "their area covered are omitted. anomaly = value - cell mean over the baseline period.",
        "citation": source["citation"],
    }
    path = args.manifest_dir / f"{stem}.provenance.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    cells = int(np.isfinite(grid).all(axis=0).sum())
    print(f"{name}: {rows} rows | {kept[0]}-{kept[-1]} ({len(kept)} years) | {cells} complete cells | "
          f"missing chunks: {missing} | {output}")
    print("  next step: dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize "
          f"--source {output.as_posix()} --variable {variable} --output {stem}.parquet")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--variables", nargs="+", default=list(VARIABLES), choices=list(VARIABLES))
    parser.add_argument("--cache", type=Path, default=Path("data/nasa/raw/power"))
    parser.add_argument("--output-dir", type=Path, default=Path("data/nasa/raw"))
    parser.add_argument("--manifest-dir", type=Path, default=Path("backend/seed"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()
    for name in args.variables:
        convert(name, args)


if __name__ == "__main__":
    main()
