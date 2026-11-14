"""Mascons de GRACE y GRACE-FO (NASA GSFC) al CSV que consume el normalizador del ETL.

Por qué esta fuente: los mascons de JPL que distribuye PO.DAAC piden cuenta de Earthdata, y la capa de
GRACE de NASA GIBS satura en ±30 cm (medido: un tercio de los mascons de tierra supera ese valor en
algún mes, justo donde está la señal: Groenlandia, la Antártida, Alaska). El laboratorio de geodesia de
NASA Goddard publica su solución completa, sin cuenta, como texto: 41.168 mascons de 1° de igual área
con un valor mensual en centímetros de agua equivalente.

Qué hace con los datos, y por qué:
  * Se queda con los mascons de tierra y hielo apoyado en tierra (Groenlandia, Antártida, glaciares del
    golfo de Alaska y resto de tierra). Los del océano miden presión en el fondo y las plataformas de
    hielo flotan: son otra magnitud y la capa del producto es "agua y hielo en tierra".
  * Cada mascon es un rectángulo en latitud y longitud. Se reparte en la grilla de 2° de GISTEMP por el
    área de solape en la esfera; una celda con menos de la mitad de su área en tierra queda sin fila.
  * Cada solución se asigna al mes de su día central. Los meses sin solución (hueco entre GRACE y
    GRACE-FO, apagados por batería) no se imputan.
  * value y anomaly llevan lo mismo: el producto ya es una anomalía respecto a la media 2004-2009.

Requisitos: pip install numpy
Uso (desde la raíz del repo):
    python scripts/etl/gsfc_mascons_to_csv.py
Salida:
    data/nasa/raw/grace_mascons.csv              lat, lon, time (AAAA-MM-01), value, anomaly
    backend/seed/grace_mascons.provenance.json   procedencia que la API expone (se versiona)
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
LAND_LOCATIONS = (1, 3, 5, 80)  # Groenlandia, Antártida, golfo de Alaska y tierra; fuera océano (90) y plataformas (4)
CITATION = ("Loomis, B. D., Luthcke, S. B., Sabaka, T. J. (2019). Regularization and error characterization of GRACE "
            "mascons. Journal of Geodesy, 93, 1381-1398. doi:10.1007/s00190-019-01252-y. Solución RL06v2.0 "
            "(OBP-ICE6GD) de NASA Goddard Space Flight Center, Geodesy and Geophysics Laboratory.")


def read_table(archive: zipfile.ZipFile, name: str) -> np.ndarray:
    """Tabla numérica de uno de los ficheros de texto: todo lo que sigue a la línea END OF HEADER."""
    with archive.open(f"{PRODUCT}/{name}") as raw:
        handle = io.TextIOWrapper(raw, encoding="ascii", errors="replace")
        for line in handle:
            if line.startswith("END OF HEADER"):
                break
        return np.loadtxt(handle)


def overlaps(placement: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Área de solape (en la esfera unidad) de cada mascon con cada celda de 2°: celda, mascon, peso."""
    lat_edges = np.arange(-90, 90 + TARGET_DEGREES, TARGET_DEGREES)
    lon_edges = np.arange(-180, 180 + TARGET_DEGREES, TARGET_DEGREES)
    n_lon = len(lon_edges) - 1
    cells, mascons, weights = [], [], []
    for index, (lat, lon, d_lat, d_lon) in enumerate(placement[:, :4]):
        # Los dos mascons polares vienen centrados en el polo: son un casquete de d_lat grados, no medio.
        south, north = lat - d_lat / 2, lat + d_lat / 2
        south, north = (90 - d_lat, 90.0) if north > 90 else (-90.0, -90 + d_lat) if south < -90 else (south, north)
        a = np.maximum(south, lat_edges[:-1])
        b = np.minimum(north, lat_edges[1:])
        band = np.where(b > a, np.sin(np.radians(b)) - np.sin(np.radians(a)), 0.0)
        # El fichero da la longitud de 0 a 360: se prueba desplazada para cubrir el cruce del antimeridiano.
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
    parser.add_argument("--last", default="2025-12", help="último mes (AAAA-MM); se cierra en un año completo")
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
        solution = read_table(archive, f"{PRODUCT}.txt")  # mascons x soluciones, en cm de agua equivalente

    months = [(dt.date(int(year), 1, 1) + dt.timedelta(days=float(day) - 1)).strftime("%Y-%m")
              for year, day in times[:, :2]]
    if len(set(months)) != len(months):
        raise SystemExit("Dos soluciones caen en el mismo mes: decidir cómo combinarlas antes de seguir.")

    land = np.isin(placement[:, 6].astype(int), LAND_LOCATIONS)
    cells, mascons, weights = overlaps(placement[land])
    n_lat, n_lon = round(180 / TARGET_DEGREES), round(360 / TARGET_DEGREES)
    covered = np.bincount(cells, weights=weights, minlength=n_lat * n_lon)
    total = np.zeros((n_lat * n_lon, solution.shape[1]))
    np.add.at(total, cells, weights[:, None] * solution[land][mascons])

    # Comprobación del reparto: la media de tierra ponderada por área no debe cambiar al pasar a la grilla.
    area = placement[land, 5]
    before = (solution[land] * area[:, None]).sum(axis=0) / area.sum()
    after = total.sum(axis=0) / covered.sum()
    drift = float(np.abs(before - after).max())
    if drift > 0.05:
        raise SystemExit(f"El regrillado cambia la media de tierra en {drift:.3f} cm: revisar los solapes.")

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
        "product": "GRACE y GRACE-FO · mascons de NASA GSFC RL06v2.0 (agua y hielo en tierra, cm de agua equivalente)",
        "baseline": "2004-2009", "unit": "cm EWH", "trendUnit": "cm EWH / año", "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": SOURCE_URL, "sourceFile": package.name,
        "sourceSha256": hashlib.sha256(package.read_bytes()).hexdigest(),
        "retrievedAt": dt.datetime.fromtimestamp(package.stat().st_mtime, dt.timezone.utc).isoformat(timespec="seconds"),
        "coverageStart": int(used[0][:4]), "coverageEnd": int(used[-1][:4]), "lastMonth": used[-1], "rows": rows,
        "processing": f"{int(land.sum())} mascons de tierra y hielo apoyado (de {len(placement)}), repartidos en la "
                      f"grilla de 2° por área de solape; celdas con menos del {MIN_COVERAGE:.0%} de su área en "
                      f"tierra, sin fila. {len(used)} soluciones mensuales, cada una en el mes de su día central; "
                      "los meses sin solución no se imputan. Corrección de rebote posglacial ICE-6G_D incluida "
                      f"en el producto. La media de tierra cambia como máximo {drift:.4f} cm al regrillar.",
        "citation": CITATION,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{rows} filas | {used[0]} a {used[-1]} ({len(used)} meses) | {int(keep.sum())} celdas | "
          f"mín {np.nanmin(grid):.1f} máx {np.nanmax(grid):.1f} cm | deriva de la media {drift:.5f} cm | {args.output}")


if __name__ == "__main__":
    main()
