"""Convierte medias anuales de NASA POWER v10 (MERRA-2 y GPM IMERG) al CSV que consume el ETL.

Por qué existe: el reto nombra MERRA-2 (modelo) y GPM (misión), y NASA POWER publica los dos
completos en un bucket abierto, sin cuenta ni token. Es el mismo camino que GISTEMP: este conversor
es la única pieza específica de la fuente; ni la API ni el frontend cambian.

Qué hace con los datos, y por qué:
  * Usa la media ANUAL que ya calcula POWER (no promedia meses aquí): una fila por celda y año.
  * Regrilla de la resolución nativa (0,5° x 0,625° en MERRA-2; 0,1° en IMERG) a la grilla de 2° de
    GISTEMP, para que todas las fuentes compartan celdas. Promedio ponderado por el área de solape.
  * Una celda de 2° con menos de la mitad de su área con dato se deja sin fila (costas en variables
    que sólo existen sobre tierra, o latitudes que IMERG no cubre): no se inventa ni se imputa.
  * anomaly = valor - media de la celda en el periodo base de la fuente. La pendiente es la misma con
    valor o anomalía; la anomalía hace legible el mapa de un año concreto.

Requisitos: pip install numpy numcodecs
Uso (desde la raíz del repo):
    python scripts/etl/nasa_power_zarr_to_csv.py                    # todas las variables
    python scripts/etl/nasa_power_zarr_to_csv.py --variables IMERG_PRECTOT
Salida, por variable:
    data/nasa/raw/<archivo>.csv                 lat, lon, time (AAAA-01-01), value, anomaly
    backend/seed/<archivo>.provenance.json      procedencia que la API expone (se versiona)
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
        "name": "MERRA-2", "native": "0,5° x 0,625°", "baseline": (1991, 2020),
        "citation": POWER_CITATION + "Datos derivados de MERRA-2: Gelaro et al. (2017), J. Climate 30, "
                    "5419-5454, doi:10.1175/JCLI-D-16-0758.1",
    },
    # IMERG empieza en 1998: su periodo base no puede ser el 1991-2020 de MERRA-2.
    "imerg": {
        "store": "imerg/temporal/power_imerg_annual_temporal_utc.zarr", "provider": "nasa-power-imerg",
        "name": "GPM IMERG", "native": "0,1°", "baseline": (2001, 2020),
        "citation": POWER_CITATION + "Datos derivados de GPM IMERG (Integrated Multi-satellitE Retrievals "
                    "for GPM), NASA Goddard. POWER marca este parámetro como 'reviewing'.",
    },
}
# parámetro POWER -> (fuente, variable del dominio, archivo, unidad, unidad de tendencia, producto, decimales)
VARIABLES = {
    "T2M": ("merra2", "Merra2Temperature", "merra2_t2m", "°C", "°C / año", "temperatura del aire a 2 m", 3),
    "PRECTOTCORR": ("merra2", "Merra2Precipitation", "merra2_precipitation", "mm/day", "mm/día / año",
                    "precipitación total corregida", 3),
    "EVLAND": ("merra2", "Merra2Evaporation", "merra2_evaporation", "mm/day", "mm/día / año",
               "evaporación en tierra", 3),
    "GWETROOT": ("merra2", "Merra2SoilMoisture", "merra2_soil_moisture", "fraction", "fracción / año",
                 "humedad del suelo en la zona de raíces (0-1)", 4),
    "IMERG_PRECTOT": ("imerg", "GpmPrecipitation", "gpm_imerg_precipitation", "mm/day", "mm/día / año",
                      "precipitación total estimada por satélite", 3),
}


def convert(name: str, args: argparse.Namespace) -> None:
    source_key, variable, stem, unit, trend_unit, label, decimals = VARIABLES[name]
    source = SOURCES[source_key]
    zarr = PowerZarr(source["store"], args.cache / source_key, args.workers)
    lat, lon = zarr.axis("lat"), zarr.axis("lon")
    # Las unidades del eje son "days since AAAA-12-31": cada paso es el 31 de diciembre de su año.
    origin = dt.date.fromisoformat(zarr.attrs("time")["units"].split("since ")[1][:10])
    years = np.array([(origin + dt.timedelta(days=int(d))).year for d in zarr.axis("time")])

    cube, source_sha, missing = zarr.read(name)
    complete = np.isfinite(cube).any(axis=(1, 2))  # el Zarr reserva años futuros, todavía vacíos
    cube, kept = cube[complete], years[complete]
    grid = regrid(cube, lat, lon)

    first, last = source["baseline"]
    base = (kept >= first) & (kept <= last)
    if base.sum() != last - first + 1:
        raise SystemExit(f"{name}: el periodo base {first}-{last} no está completo en la fuente.")
    with np.errstate(invalid="ignore"):
        # Media simple (no nanmean): una celda con algún año base sin dato queda sin anomalía y sin fila.
        anomaly = grid - grid[base].mean(axis=0)

    output = args.output_dir / f"{stem}.csv"
    rows = write_csv(output, grid, anomaly, kept, decimals)
    manifest = {
        "variable": variable,
        "provider": source["provider"],
        "product": f"{source['name']} · {label} (NASA POWER v10, media anual)",
        "baseline": f"{first}-{last}",
        "unit": unit,
        "trendUnit": trend_unit,
        # MERRA-2 y GPM son fuentes que nombra el propio reto: no son provisionales.
        "interim": False,
        "resolutionDegrees": TARGET_DEGREES,
        "sourceUrl": f"{zarr.url}/{name}",
        "sourceFile": f"{Path(source['store']).name}/{name}",
        # SHA-256 de los bloques comprimidos del array, concatenados en orden (latitud, longitud).
        "sourceSha256": source_sha,
        "retrievedAt": dt.datetime.fromtimestamp(zarr.retrieved_at(name), dt.timezone.utc)
            .isoformat(timespec="seconds"),
        "coverageStart": int(kept[0]),
        "coverageEnd": int(kept[-1]),
        "lastMonth": f"{int(kept[-1]):04d}-12",
        "rows": rows,
        "processing": f"Media anual de POWER regrillada de {source['native']} a {TARGET_DEGREES:g}° con promedio "
                      f"ponderado por área; celdas con menos del {round(MIN_COVERAGE * 100)} por ciento de su área "
                      "con dato, sin fila. anomaly = valor - media de la celda en el periodo base.",
        "citation": source["citation"],
    }
    path = args.manifest_dir / f"{stem}.provenance.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    cells = int(np.isfinite(grid).all(axis=0).sum())
    print(f"{name}: {rows} filas | {kept[0]}-{kept[-1]} ({len(kept)} años) | {cells} celdas completas | "
          f"bloques ausentes: {missing} | {output}")
    print("  siguiente paso: dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize "
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
