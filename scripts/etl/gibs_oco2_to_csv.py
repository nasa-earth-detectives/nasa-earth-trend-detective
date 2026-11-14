"""XCO2 de OCO-2 (capa de NASA GIBS) al CSV que consume el normalizador del ETL.

Por qué por GIBS: el XCO2 de OCO-2 (producto OCO2_L2_Lite_FP de GES DISC) pide cuenta de Earthdata.
GIBS, el servicio abierto de imágenes de la NASA, pinta esos mismos sondeos, día a día, con una paleta
oficial que asigna a cada color un intervalo de 0,4 ppm: el valor se recupera hasta ese ancho.

Por qué el WMS y no las teselas: OCO-2 mide una franja de unos 10 km de ancho. En el nivel 2 de la
pirámide de teselas (0,14° por píxel) quedan unos 1.500 píxeles con dato por día; pidiendo el planeta
entero al WMS a 0,07° salen unos 6.000, con una sola petición por día en vez de quince.

Qué hace con los datos, y por qué:
  * Cada píxel con color es un sondeo. No hay "cobertura de área" como en un mapa continuo, así que la
    regla del 50 % de la celda no sirve aquí.
  * Da UNA media por celda y año, no una por mes. Medido: exigiendo 10 sondeos por celda y mes y 9 meses
    al año (la regla de las variables mensuales) sólo unas 158 celdas de 16.200 tienen serie completa,
    porque la franja no llena una celda de 2° cada mes.
  * El año de una celda es la media de sus medias mensuales, para que un mes con muchos sondeos no pese
    más que otro: el CO₂ tiene ciclo estacional y una media directa de sondeos se iría hacia el verano.
    Un mes cuenta con MIN_SAMPLES sondeos o más; un año, con MIN_MONTHS meses o más.
  * Las dos clases abiertas de la paleta (menos de 380 ppm y 480 ppm o más) no tienen valor recuperable:
    se descartan y se cuentan en el manifiesto.
  * Sólo se piden los días que GIBS declara en su catálogo; un día sin datos no se pide ni se imputa.
  * Deja la columna anomaly vacía: el XCO2 se analiza como concentración, no como anomalía.

Requisitos: pip install numpy pillow
Uso (desde la raíz del repo):
    python scripts/etl/gibs_oco2_to_csv.py
Salida:
    data/nasa/raw/oco2_xco2.csv                  lat, lon, time (AAAA-01-01), value, anomaly
    backend/seed/oco2_xco2.provenance.json       procedencia que la API expone (se versiona)
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
WIDTH, HEIGHT = 5120, 2560  # 0,0703° por píxel: unos 7,8 km en el ecuador, del orden del ancho de la franja
WMS_URL = (GIBS + "/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=" + LAYER
           + "&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:4326&BBOX=-180,-90,180,90"
           + f"&WIDTH={WIDTH}&HEIGHT={HEIGHT}" + "&TIME={day}")
MIN_SAMPLES = 3  # sondeos mínimos para dar por medida una celda en un mes
MIN_MONTHS = 6  # meses medidos mínimos para dar por medido el año de una celda
MAX_UNKNOWN_SHARE = 1e-4  # fracción tolerada de píxeles con un color ajeno a la paleta antes de abortar
# Titulo, version e identificador tal como los declara GIBS en los metadatos de la capa
# (layer-metadata/v1.0): no se anaden autores ni anio que no se hayan comprobado.
CITATION = ("OCO-2 Level 2 bias-corrected XCO2 and other select fields from the full-physics retrieval "
            "aggregated as daily files, Retrospective processing V11.2r (OCO2_L2_Lite_FP). NASA GES DISC, "
            "concept id C2912085112-GES_DISC. Imagen servida por NASA Global Imagery Browse Services (GIBS), "
            "ESDIS.")


def fetch(url: str, path: Path) -> bytes:
    """Descarga con caché en disco: relanzar el script no vuelve a pedir lo que ya está."""
    if path.exists() and path.stat().st_size:
        return path.read_bytes()
    with urllib.request.urlopen(url, timeout=180) as response:
        data = response.read()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def published_days(cache: Path, first: dt.date, last: dt.date) -> list[dt.date]:
    """Días que el catálogo de GIBS declara para la capa, recortados al periodo pedido."""
    xml = fetch(CAPABILITIES_URL, cache / "WMTSCapabilities.xml").decode("utf-8", errors="replace")
    layer = next(block for block in re.findall(r"<Layer>.*?</Layer>", xml, flags=re.S)
                 if f"<ows:Identifier>{LAYER}</ows:Identifier>" in block)
    days: set[dt.date] = set()
    for start, end, period in re.findall(r"<Value>([\d-]+)/([\d-]+)/(P\w+)</Value>", layer):
        if period != "P1D":
            raise SystemExit(f"La capa ya no es diaria ({period}): revisar el script antes de seguir.")
        day, stop = dt.date.fromisoformat(start), dt.date.fromisoformat(end)
        while day <= stop:
            if first <= day <= last:
                days.add(day)
            day += dt.timedelta(days=1)
    return sorted(days)


def color_table(cache: Path) -> tuple[np.ndarray, np.ndarray]:
    """Tabla color -> ppm (punto medio del intervalo) y marca de los colores de las clases abiertas."""
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
                        help="primer día (AAAA-MM-DD). La capa empieza el 2014-09-06: 2014 no llega a un año")
    parser.add_argument("--last", default="2025-12-31", help="último día; se cierra en un año completo")
    parser.add_argument("--cache", type=Path, default=Path("data/nasa/raw/gibs_oco2"))
    parser.add_argument("--output", type=Path, default=Path("data/nasa/raw/oco2_xco2.csv"))
    parser.add_argument("--manifest", type=Path, default=Path("backend/seed/oco2_xco2.provenance.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    days = published_days(args.cache, dt.date.fromisoformat(args.first), dt.date.fromisoformat(args.last))
    table, open_ended = color_table(args.cache)
    paths = {day: args.cache / f"{day.year}" / f"{day.isoformat()}.png" for day in days}
    # Primero se baja todo en paralelo (queda en caché); después se procesa día a día, en orden.
    with ThreadPoolExecutor(args.workers) as pool:
        list(pool.map(lambda day: fetch(WMS_URL.format(day=day.isoformat()), paths[day]), days))

    # Celda de 2° de cada píxel, por la posición de su centro (el norte está en la primera fila).
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
        # Sólo se miran los píxeles con color (unos miles de 13 millones): convertir la imagen entera
        # multiplica el tiempo por más de diez.
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
    # Unos pocos píxeles sueltos con un color ajeno a la paleta se descartan y se cuentan. Si fueran muchos,
    # el WMS estaría mezclando colores al reducir la imagen y ningún valor sería de fiar: ahí sí se aborta.
    if unknown > MAX_UNKNOWN_SHARE * soundings:
        raise SystemExit(f"{unknown} píxeles con un color que no está en la paleta: el WMS está mezclando colores.")
    if strangers:
        top = sorted(strangers.items(), key=lambda item: -item[1])[:5]
        print("colores fuera de la paleta (RGB: píxeles):",
              ", ".join(f"{c >> 16},{(c >> 8) & 255},{c & 255}: {n}" for c, n in top))

    # Media anual = media de las medias mensuales con sondeos suficientes.
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
        "product": "OCO-2 · XCO₂, media de la columna (capa " + LAYER + " de NASA GIBS, media anual por celda)",
        "baseline": None, "unit": "ppm", "trendUnit": "ppm / año", "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": WMS_URL.format(day="{AAAA-MM-DD}"),
        "sourceFile": f"{LAYER}, WMS {WIDTH}x{HEIGHT}, {len(days)} días",
        # SHA-256 de las imágenes PNG diarias, concatenadas por fecha.
        "sourceSha256": digest.hexdigest(),
        "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "coverageStart": int(years[0]), "coverageEnd": int(years[-1]), "lastMonth": used[-1], "rows": rows,
        "processing": f"XCO₂ recuperado de la imagen diaria con la paleta oficial de GIBS (clases de 0,4 ppm): "
                      f"{soundings} sondeos en {len(days)} días. Media anual por celda de 2° = media de sus medias "
                      f"mensuales; un mes cuenta con {MIN_SAMPLES} sondeos o más y un año con {MIN_MONTHS} meses o "
                      f"más. Sondeos fuera del rango de la paleta (menos de 380 ppm o 480 ppm o más), descartados: "
                      f"{discarded}. Píxeles con un color ajeno a la paleta, descartados: {unknown}.",
        "citation": CITATION,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{rows} filas | {years[0]} a {years[-1]} ({len(used)} meses, {len(days)} días) | {soundings} sondeos | "
          f"descartados {discarded} | celdas por año: {[int(np.isfinite(annual[y]).sum()) for y in years]} | {args.output}")


if __name__ == "__main__":
    main()
