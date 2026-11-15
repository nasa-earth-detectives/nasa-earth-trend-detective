"""Prepares the Moon for the scene using NASA's CGI Moon Kit (SVS 4720).

Rationale: browsers do not support 16-bit TIFF and the Moon requires relief so craters are
visible under grazing terminator light. Relief does not displace geometry: it is converted to a
normal map (tangent space, OpenGL convention used by three.js: green = north).

Input (data/nasa/raw/moon/):
    lroc_color_2k.jpg   LRO color, 2048x1024, longitude 0 at center
    ldem_4_uint.tif     elevation, 1440x720 (4 px/degree), unsigned half-meters
Output (frontend/public/earth/moon/):
    lroc-color-2k.jpg   direct copy
    ldem-normal-1k.jpg  normals, 1440x720 (JPEG 90: PNG was 2 MB)

Credit: NASA's Scientific Visualization Studio.
"""
from __future__ import annotations

import argparse
import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

RADIO_LUNAR_M = 1_737_400
# Relief exaggeration: at 7.6 km per pixel actual slopes are gentle and, without exaggeration,
# craters are barely discernible under grazing light.
EXAGERACION = 4.0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--raw", type=Path, default=Path("data/nasa/raw/moon"))
    parser.add_argument("--out", type=Path, default=Path("frontend/public/earth/moon"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.raw / "lroc_color_2k.jpg", args.out / "lroc-color-2k.jpg")

    alturas = np.array(Image.open(args.raw / "ldem_4_uint.tif")).astype(np.float64) / 2.0  # meters
    filas, columnas = alturas.shape
    paso = (math.pi / filas) * RADIO_LUNAR_M  # meters per pixel in latitude
    latitudes = np.radians(90 - (np.arange(filas) + 0.5) * 180 / filas)[:, None]
    paso_este = paso * np.maximum(np.cos(latitudes), 0.05)  # meridians converge

    # Central differences; map is periodic in longitude (wraps at ±180°).
    dz_este = (np.roll(alturas, -1, axis=1) - np.roll(alturas, 1, axis=1)) / (2 * paso_este)
    dz_norte = np.zeros_like(alturas)
    dz_norte[1:-1] = (alturas[:-2] - alturas[2:]) / (2 * paso)  # lower row = further north
    normal = np.dstack([-dz_este * EXAGERACION, -dz_norte * EXAGERACION, np.ones_like(alturas)])
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    rgb = np.clip((normal + 1) * 127.5, 0, 255).astype(np.uint8)
    Image.fromarray(rgb, "RGB").save(args.out / "ldem-normal-1k.jpg", quality=90, optimize=True)

    pendiente = np.degrees(np.arctan(np.hypot(dz_este, dz_norte)))
    print(f"elevations {alturas.min():.0f}..{alturas.max():.0f} m | slope p99 {np.percentile(pendiente, 99):.1f}° "
          f"(unexaggerated) | {args.out}")


if __name__ == "__main__":
    main()
