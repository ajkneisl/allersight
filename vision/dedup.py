"""Deduplication logic so we don't upload the same plate twice."""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass

import imagehash
import numpy as np
from PIL import Image


@dataclass
class _HashEntry:
    phash: imagehash.ImageHash
    timestamp: float


class DedupTracker:
    """Keeps a ring-buffer of perceptual hashes and rejects near-duplicates."""

    def __init__(
        self,
        max_entries: int = 64,
        distance_threshold: int = 12,
        cooldown_seconds: int = 30,
    ) -> None:
        self._max_entries = max_entries
        self._distance_threshold = distance_threshold
        self._cooldown_seconds = cooldown_seconds
        self._history: deque[_HashEntry] = deque(maxlen=max_entries)

    def is_duplicate(self, crop: np.ndarray) -> bool:
        """Return True if *crop* (BGR numpy array) looks like something we
        already uploaded recently."""
        pil_img = Image.fromarray(crop[:, :, ::-1])  # BGR → RGB
        h = imagehash.phash(pil_img, hash_size=16)
        now = time.monotonic()

        for entry in self._history:
            age = now - entry.timestamp
            if age > self._cooldown_seconds:
                continue
            if h - entry.phash <= self._distance_threshold:
                return True

        return False

    def record(self, crop: np.ndarray) -> None:
        """Add a crop's hash to the history (call after a successful upload)."""
        pil_img = Image.fromarray(crop[:, :, ::-1])
        h = imagehash.phash(pil_img, hash_size=16)
        self._history.append(_HashEntry(phash=h, timestamp=time.monotonic()))
