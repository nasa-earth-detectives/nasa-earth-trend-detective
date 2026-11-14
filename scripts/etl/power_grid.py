"""Regrillado a la grilla de 2° de GISTEMP y escritura del CSV canónico del ETL.

Separado del conversor para que cada archivo se lea de una vez. El regrillado es un promedio ponderado
por el área de solape en la esfera, y se valida comprobando que la media mundial no cambia.
"""
from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

TARGET_DEGREES = 2.0
MIN_COVERAGE = 0.5  # fracción mínima del área de la celda de 2° que debe tener dato


def lat_weights(lat: np.ndarray, step: float = TARGET_DEGREES) -> np.ndarray:
    """Área de solape (diferencia de senos) entre cada banda nativa y cada banda de la grilla destino."""
    half = abs(lat[1] - lat[0]) / 2
    lo, hi = np.clip(lat - half, -90, 90), np.clip(lat + half, -90, 90)
    edges = np.arange(-90, 90 + step, step)
    a = np.maximum(lo[None, :], edges[:-1, None])
    b = np.minimum(hi[None, :], edges[1:, None])
    return np.where(b > a, np.sin(np.radians(b)) - np.sin(np.radians(a)), 0.0)


def lon_weights(lon: np.ndarray, step: float = TARGET_DEGREES) -> np.ndarray:
    """Grados de solape en longitud. Una celda nativa centrada en -180 cruza el antimeridiano: se prueba
    también desplazada 360° para que su mitad occidental caiga en la última celda destino."""
    half = abs(lon[1] - lon[0]) / 2
    edges = np.arange(-180, 180 + step, step)
    total = np.zeros((len(edges) - 1, len(lon)))
    for shift in (-360.0, 0.0, 360.0):
        a = np.maximum(lon[None, :] - half + shift, edges[:-1, None])
        b = np.minimum(lon[None, :] + half + shift, edges[1:, None])
        total += np.clip(b - a, 0, None)
    return total


def regrid(cube: np.ndarray, lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """Media ponderada ignorando los huecos; NaN si el dato cubre menos de MIN_COVERAGE de la celda.

    Va año por año con dos productos de matrices. Un einsum de tres operandos sin optimizar recorre los
    cinco índices a la vez (más de diez minutos por variable), y hacerlo con el cubo entero de IMERG
    (32 x 1800 x 3600) en doble precisión no cabe en memoria.
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
    """Una fila por celda y año con dato: lat, lon, time (AAAA-01-01), value, anomaly."""
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
