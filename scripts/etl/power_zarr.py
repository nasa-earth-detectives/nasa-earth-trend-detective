"""Minimal reader for public NASA POWER Zarr stores (open `nasa-power` bucket, no account required).

Why the `zarr` library is not used: we only need full chunks of a 3D array and its axes. Reading them
over HTTPS with `urllib` and decoding with `numcodecs` avoids depending on zarr + s3fs + xarray (and
breaking changes across their versions) for what is ~40 lines of code.

Each chunk is cached as-received (compressed) on disk: repeating a conversion does not re-download
anything, and the source SHA-256 is computed over those exact bytes.
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
# A chunk that does not exist in the bucket means "all fill value" in Zarr; mark it with an empty
# file so we do not re-request it on subsequent runs.
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
        """1D axis (lat, lon, time): single chunk, no filters."""
        spec = self.meta[f"{name}/.zarray"]
        return np.frombuffer(Blosc().decode(self._fetch(f"{name}/0")), dtype=spec["dtype"]).copy()

    def read(self, name: str) -> tuple[np.ndarray, str, int]:
        """Full (time, lat, lon) array, SHA-256 of its raw chunks, and count of missing chunks."""
        spec = self.meta[f"{name}/.zarray"]
        shape, chunks = spec["shape"], spec["chunks"]
        if chunks[0] != shape[0]:
            raise SystemExit(f"{name}: expected a single chunk along time, got {shape[0]}/{chunks[0]}.")
        filters = [FixedScaleOffset(offset=f["offset"], scale=f["scale"], dtype=f["dtype"], astype=f["astype"])
                   for f in spec.get("filters") or [] if f["id"] == "fixedscaleoffset"]
        if len(filters) != len(spec.get("filters") or []):
            raise SystemExit(f"{name}: unsupported Zarr filter: {spec['filters']}")
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
            # Edge chunks are padded to full chunk size: slice down to the array bounds.
            part = out[:, la:la + chunks[1], lo:lo + chunks[2]]
            part[...] = tile[:, :part.shape[1], :part.shape[2]]
        return out, digest.hexdigest(), missing

    def retrieved_at(self, name: str) -> float:
        """Download timestamp = the most recently modified cached chunk for the variable."""
        return max(p.stat().st_mtime for p in (self.cache / name).iterdir())
