"""Prepara la Luna para la escena a partir del CGI Moon Kit de la NASA (SVS 4720).

Por qué: el navegador no lee TIFF de 16 bits y la Luna necesita relieve para que los cráteres se
vean con la luz rasante del terminador. El relieve no desplaza geometría: se convierte en mapa de
normales (espacio tangente, convención OpenGL que usa three.js: verde = norte).

Entrada (data/nasa/raw/moon/):
    lroc_color_2k.jpg   color LRO, 2048x1024, longitud 0 en el centro
    ldem_4_uint.tif     elevación, 1440x720 (4 px/grado), medios metros sin signo
Salida (frontend/public/earth/moon/):
    lroc-color-2k.jpg   copia tal cual
    ldem-normal-1k.jpg  normales, 1440x720 (JPEG 90: el PNG pesaba 2 MB)

Crédito: NASA's Scientific Visualization Studio.
"""
from __future__ import annotations

import argparse
import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

RADIO_LUNAR_M = 1_737_400
# Exageración del relieve: a 7,6 km por píxel las pendientes reales son suaves y, sin exagerar,
# los cráteres apenas se distinguen con luz rasante.
EXAGERACION = 4.0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--raw", type=Path, default=Path("data/nasa/raw/moon"))
    parser.add_argument("--out", type=Path, default=Path("frontend/public/earth/moon"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.raw / "lroc_color_2k.jpg", args.out / "lroc-color-2k.jpg")

    alturas = np.array(Image.open(args.raw / "ldem_4_uint.tif")).astype(np.float64) / 2.0  # metros
    filas, columnas = alturas.shape
    paso = (math.pi / filas) * RADIO_LUNAR_M  # metros por píxel en latitud
    latitudes = np.radians(90 - (np.arange(filas) + 0.5) * 180 / filas)[:, None]
    paso_este = paso * np.maximum(np.cos(latitudes), 0.05)  # los meridianos convergen

    # Diferencias centrales; en longitud el mapa es periódico (se envuelve en ±180°).
    dz_este = (np.roll(alturas, -1, axis=1) - np.roll(alturas, 1, axis=1)) / (2 * paso_este)
    dz_norte = np.zeros_like(alturas)
    dz_norte[1:-1] = (alturas[:-2] - alturas[2:]) / (2 * paso)  # fila menor = más al norte
    normal = np.dstack([-dz_este * EXAGERACION, -dz_norte * EXAGERACION, np.ones_like(alturas)])
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    rgb = np.clip((normal + 1) * 127.5, 0, 255).astype(np.uint8)
    Image.fromarray(rgb, "RGB").save(args.out / "ldem-normal-1k.jpg", quality=90, optimize=True)

    pendiente = np.degrees(np.arctan(np.hypot(dz_este, dz_norte)))
    print(f"alturas {alturas.min():.0f}..{alturas.max():.0f} m | pendiente p99 {np.percentile(pendiente, 99):.1f}° "
          f"(sin exagerar) | {args.out}")


if __name__ == "__main__":
    main()
