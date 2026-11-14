"""Regridding to the 2° GISTEMP grid and writing the canonical ETL CSV.

Separated from the converter so each file stays concise and focused. Regridding uses an overlap-area
weighted average on the sphere, validated by checking that the global mean is preserved.
"""
from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

TARGET_DEGREES = 2.0
MIN_COVERAGE = 0.5  # minimum fraction of the 2° cell area that must have valid data


def lat_weights(lat: np.ndarray, step: float = TARGET_DEGREES) -> np.ndarray:
    """Overlap area (sine difference) between each native band and each target grid band."""
    half = abs(lat[1] - lat[0]) / 2
    lo, hi = np.clip(lat - half, -90, 90), np.clip(lat + half, -90, 90)
    edges = np.arange(-90, 90 + step, step)
    a = np.maximum(lo[None, :], edges[:-1, None])
    b = np.minimum(hi[None, :], edges[1:, None])
    return np.where(b > a, np.sin(np.radians(b)) - np.sin(np.radians(a)), 0.0)


def lon_weights(lon: np.ndarray, step: float = TARGET_DEGREES) -> np.ndarray:
    """Overlap degrees in longitude. A native cell centered at -180 crosses the antimeridian: also test
    shifted by ±360° so its western half lands in the rightmost target cell."""
    half = abs(lon[1] - lon[0]) / 2
    edges = np.arange(-180, 180 + step, step)
    total = np.zeros((len(edges) - 1, len(lon)))
    for shift in (-360.0, 0.0, 360.0):
        a = np.maximum(lon[None, :] - half + shift, edges[:-1, None])
        b = np.minimum(lon[None, :] + half + shift, edges[1:, None])
        total += np.clip(b - a, 0, None)
    return total


def regrid(cube: np.ndarray, lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """Weighted mean ignoring gaps; NaN if valid data covers less than MIN_COVERAGE of the cell.

    Processes year by year with two matrix products. An unoptimized three-operand einsum iterates over
    all five indices at once (over ten minutes per variable), and doing the entire IMERG cube
    (32 x 1800 x 3600) in double precision does not fit in memory.
    """
    w_lat, w_lon = lat_weights(lat), lon_weights(lon)
    full = w_lat.sum(axis=1)[:, None] * w_lon.sum(axis=1)[None, :]
    out = np.empty((cube.shape[0], w_lat.shape[0], w_lon.shape[0]))
    for index, layer in enumerate(cube):
        layer = layer.astype(float)
        valid = np.isfinite(layer)
        num = w_lat @ np.where(valid, layer, 0.0) @ w_lon.T
        den = w_lat @ valid.astype(float) @ w_lon.T
        with np.errstate(invalid="ignore", divide="ignore"):
            out[index] = np.where(den >= MIN_COVERAGE * full, num / den, np.nan)
    return out


def write_csv(output: Path, grid: np.ndarray, anomaly: np.ndarray, years: np.ndarray, decimals: int) -> int:
    """One row per cell and year with valid data: lat, lon, time (YYYY-01-01), value, anomaly."""
    centers_lat = np.arange(-90 + TARGET_DEGREES / 2, 90, TARGET_DEGREES)
    centers_lon = np.arange(-180 + TARGET_DEGREES / 2, 180, TARGET_DEGREES)
    output.parent.mkdir(parents=True, exist_ok=True)
    rows = 0
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["lat", "lon", "time", "value", "anomaly"])
        for t, year in enumerate(years):
            ok = np.isfinite(grid[t]) & np.isfinite(anomaly[t])
            for b, c in zip(*np.nonzero(ok)):
                writer.writerow([f"{centers_lat[b]:.1f}", f"{centers_lon[c]:.1f}", f"{year:04d}-01-01",
                                 f"{grid[t, b, c]:.{decimals}f}", f"{anomaly[t, b, c]:.{decimals}f}"])
            rows += int(ok.sum())
    return rows
