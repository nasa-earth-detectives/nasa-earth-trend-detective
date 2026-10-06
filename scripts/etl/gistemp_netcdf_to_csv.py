"""Convierte el netCDF de GISTEMP v4 al CSV que consume el normalizador del ETL.

Por qué existe: el normalizador (`SpatialGridNormalizer`) lee CSV con DuckDB y GISTEMP sólo se
publica con grilla en netCDF. Este paso es la única pieza específica de la fuente: cuando el
equipo reciba otra fuente oficial, basta con otro conversor que produzca el mismo CSV y el
mismo manifiesto; ni la API ni el frontend cambian.

Uso (desde la raíz del repo):
    python scripts/etl/gistemp_netcdf_to_csv.py \
        --source data/nasa/raw/gistemp1200_GHCNv4_ERSSTv5.nc.gz --start-year 2000

Salida:
    data/nasa/raw/gistemp_v4.csv              lat, lon, time (AAAA-MM-01), value, anomaly
    backend/seed/gistemp_v4.provenance.json   procedencia que la API expone (se versiona)
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
EPOCH = dt.date(1800, 1, 1)  # unidades del archivo: "days since 1800-01-01"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def open_netcdf(source: Path) -> tuple[netcdf_file, Path | None]:
    """scipy no lee .gz: se descomprime a un temporal que se borra al terminar."""
    if source.suffix != ".gz":
        return netcdf_file(source, "r", mmap=False), None
    descriptor, name = tempfile.mkstemp(suffix=".nc")
    os.close(descriptor)  # en Windows un descriptor abierto impide borrar el temporal
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
            raise SystemExit(f"No hay meses desde {args.start_year} en el archivo.")

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
                valid = values != fill  # sin dato: no se inventa ni se imputa aquí
                anomaly = np.round(values[valid].astype(float) * scale, 2)
                for la, lo, a in zip(lat_flat[valid], lon_flat[valid], anomaly):
                    # GISTEMP sólo publica anomalías (°C respecto a 1951-1980): valor = anomalía.
                    writer.writerow([f"{la:.1f}", f"{lo:.1f}", stamp, f"{a:.2f}", f"{a:.2f}"])
                rows += int(valid.sum())

        first, last = months[keep[0]], months[keep[-1]]
        manifest = {
            "variable": "Gistemp",
            "provider": "nasa-giss-gistemp-v4",
            "product": "GISTEMP v4 · anomalía de temperatura tierra-océano (GHCNv4 + ERSSTv5, 1200 km)",
            "baseline": "1951-1980",
            "unit": "°C Anomaly",
            # La API reporta la pendiente de Sen por año: la unidad de la tendencia viaja con el
            # dataset para que otra fuente (otra unidad o base temporal) no obligue a tocar código.
            "trendUnit": "°C / año",
            # Descarga pública de GISTEMP mientras el reto entrega su fuente oficial: la interfaz lo
            # muestra como fuente provisional y se reemplaza con otro manifiesto + Parquet.
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
        print(f"{rows} filas | {first:%Y-%m} a {last:%Y-%m} | {args.output}")
        print(f"manifiesto: {args.manifest}")
        print("siguiente paso: dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- "
              f"normalize --source {args.output} --variable Gistemp --output {args.manifest.name.split('.')[0]}.parquet")
    finally:
        nc.close()
        if tmp is not None:
            tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
