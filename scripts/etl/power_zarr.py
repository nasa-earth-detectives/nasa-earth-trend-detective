"""Lectura mínima del Zarr público de NASA POWER (bucket abierto `nasa-power`, sin cuenta).

Por qué no se usa la librería `zarr`: sólo hacen falta bloques completos de un array 3D y sus ejes.
Leerlos por HTTPS con `urllib` y decodificarlos con `numcodecs` evita depender de zarr + s3fs + xarray
(y de sus cambios entre versiones) para algo que son 40 líneas.

Cada bloque se guarda tal cual llega (comprimido) en una carpeta de caché: repetir la conversión no
vuelve a descargar nada y el SHA-256 de la fuente se calcula sobre esos mismos bytes.
"""
from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from numcodecs import Blosc, FixedScaleOffset

BUCKET_URL = "https://nasa-power.s3.amazonaws.com"
# Un bloque que no existe en el bucket equivale a "todo relleno" en Zarr; se marca con un archivo
# vacío para no volver a preguntar por él en cada ejecución.
AUSENTE = b""


class PowerZarr:
    def __init__(self, store: str, cache: Path, workers: int = 8) -> None:
        self.store = store.strip("/")
        self.cache = cache
        self.workers = workers
        self.meta = json.loads(self._fetch(".zmetadata"))["metadata"]

    @property
    def url(self) -> str:
        return f"{BUCKET_URL}/{self.store}"

    def _fetch(self, key: str) -> bytes:
        path = self.cache / key
        if path.exists():
            return path.read_bytes()
        try:
            with urllib.request.urlopen(f"{self.url}/{key}", timeout=120) as response:
                data = response.read()
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
            data = AUSENTE
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return data

    def attrs(self, name: str | None = None) -> dict:
        return self.meta[f"{name}/.zattrs" if name else ".zattrs"]

    def axis(self, name: str) -> np.ndarray:
        """Eje 1D (lat, lon, time): un solo bloque, sin filtros."""
        spec = self.meta[f"{name}/.zarray"]
        return np.frombuffer(Blosc().decode(self._fetch(f"{name}/0")), dtype=spec["dtype"]).copy()

    def read(self, name: str) -> tuple[np.ndarray, str, int]:
        """Array (tiempo, lat, lon) completo, SHA-256 de sus bloques crudos y nº de bloques ausentes."""
        spec = self.meta[f"{name}/.zarray"]
        shape, chunks = spec["shape"], spec["chunks"]
        if chunks[0] != shape[0]:
            raise SystemExit(f"{name}: se esperaba un único bloque en el tiempo y hay {shape[0]}/{chunks[0]}.")
        filters = [FixedScaleOffset(offset=f["offset"], scale=f["scale"], dtype=f["dtype"], astype=f["astype"])
                   for f in spec.get("filters") or [] if f["id"] == "fixedscaleoffset"]
        if len(filters) != len(spec.get("filters") or []):
            raise SystemExit(f"{name}: filtro Zarr no soportado: {spec['filters']}")
        sep = spec.get("dimension_separator", ".")
        keys = [(i, j) for i in range(-(-shape[1] // chunks[1])) for j in range(-(-shape[2] // chunks[2]))]
        with ThreadPoolExecutor(self.workers) as pool:
            raw = list(pool.map(lambda ij: self._fetch(f"{name}/{sep.join(('0', str(ij[0]), str(ij[1])))}"), keys))

        out = np.full(shape, np.nan, dtype="float32")
        digest, missing = hashlib.sha256(), 0
        for (i, j), block in zip(keys, raw):
            digest.update(block)
            if block == AUSENTE:
                missing += 1
                continue
            data = Blosc().decode(block)
            for codec in filters:
                data = codec.decode(data)
            tile = np.frombuffer(data, dtype=spec["dtype"]).reshape(chunks)
            la, lo = i * chunks[1], j * chunks[2]
            # Los bloques del borde vienen rellenos hasta el tamaño completo: se recorta al array.
            part = out[:, la:la + chunks[1], lo:lo + chunks[2]]
            part[...] = tile[:, :part.shape[1], :part.shape[2]]
        return out, digest.hexdigest(), missing

    def retrieved_at(self, name: str) -> float:
        """Fecha de descarga = el bloque en caché más reciente de la variable."""
        return max(p.stat().st_mtime for p in (self.cache / name).iterdir())
