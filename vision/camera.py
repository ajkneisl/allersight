"""Camera feed reader that always returns the latest frame."""

from __future__ import annotations

import logging
import threading
import time

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class CameraFeed:
    """Opens a video stream and continuously grabs frames in a background
    thread so that ``read()`` always returns the most recent frame with
    no buffer lag."""

    def __init__(self, url: str) -> None:
        self._url = url
        self._cap: cv2.VideoCapture | None = None
        self._frame: np.ndarray | None = None
        self._lock = threading.Lock()
        self._thread: threading.Thread | None = None
        self._running = False

    def open(self) -> None:
        if self._cap is not None:
            self.release()
        logger.info("Opening camera feed: %s", self._url)
        self._cap = cv2.VideoCapture(self._url)
        if not self._cap.isOpened():
            raise ConnectionError(f"Cannot open camera feed at {self._url}")
        # Minimise OpenCV internal buffer
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self._running = True
        self._thread = threading.Thread(target=self._grab_loop, daemon=True)
        self._thread.start()

    def _grab_loop(self) -> None:
        """Continuously grab frames so the buffer never grows stale."""
        while self._running and self._cap is not None:
            ok, frame = self._cap.read()
            if ok:
                with self._lock:
                    self._frame = frame
            else:
                logger.warning("Frame grab failed — reconnecting")
                self._reconnect()

    def read(self) -> np.ndarray | None:
        with self._lock:
            return self._frame

    def release(self) -> None:
        self._running = False
        if self._thread is not None:
            self._thread.join(timeout=3)
            self._thread = None
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        self._frame = None

    def _reconnect(self) -> None:
        if self._cap is not None:
            self._cap.release()
        time.sleep(2)
        try:
            self._cap = cv2.VideoCapture(self._url)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            else:
                logger.error("Reconnect failed")
        except Exception:
            logger.error("Reconnect failed — will retry")
