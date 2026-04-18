"""Shared detection + upload pipeline used by both the CLI and the web UI."""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

import cv2
import numpy as np

import websocket

from camera import CameraFeed
from config import Settings
from dedup import DedupTracker
from detector import Detection, FoodDetector
from uploader import MealUploader

logger = logging.getLogger("allervision.pipeline")

# Colours for drawing bounding boxes (BGR)
_BOX_COLOUR = (0, 255, 120)
_TEXT_COLOUR = (255, 255, 255)
_BG_COLOUR = (0, 200, 100)


@dataclass
class UploadEntry:
    """Record of a single uploaded image shown in the UI."""

    timestamp: str
    labels: list[str]
    thumbnail_b64: str  # JPEG base64 for <img src="data:...">
    success: bool
    count: int = 1


@dataclass
class FrameState:
    """The latest annotated frame + metadata, shared across threads."""

    frame: np.ndarray | None = None
    detections: list[Detection] = field(default_factory=list)
    last_upload_time: float = 0.0
    uploads_count: int = 0
    duplicates_skipped: int = 0
    upload_log: list[UploadEntry] = field(default_factory=list)
    lock: threading.Lock = field(default_factory=threading.Lock)


def draw_annotations(
    frame: np.ndarray, detections: list[Detection], state: FrameState
) -> np.ndarray:
    """Draw bounding boxes, labels, and a status bar onto *frame*."""
    annotated = frame.copy()

    for d in detections:
        cv2.rectangle(annotated, (d.x1, d.y1), (d.x2, d.y2), _BOX_COLOUR, 2)

        label = f"{d.class_name} {d.confidence:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(
            annotated, (d.x1, d.y1 - th - 8), (d.x1 + tw + 6, d.y1), _BG_COLOUR, -1
        )
        cv2.putText(
            annotated, label, (d.x1 + 3, d.y1 - 4),
            cv2.FONT_HERSHEY_SIMPLEX, 0.55, _TEXT_COLOUR, 1,
        )

    # Status bar
    h, w = annotated.shape[:2]
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, 32), (40, 40, 40), -1)
    cv2.addWeighted(overlay, 0.7, annotated, 0.3, 0, annotated)

    status = (
        f"Detections: {len(detections)}  |  "
        f"Uploads: {state.uploads_count}  |  "
        f"Dupes skipped: {state.duplicates_skipped}"
    )
    cv2.putText(
        annotated, status, (10, 22),
        cv2.FONT_HERSHEY_SIMPLEX, 0.55, _TEXT_COLOUR, 1,
    )
    return annotated


def run_pipeline(
    settings: Settings, state: FrameState, stop_event: threading.Event,
    *, token: str,
) -> None:
    """Core detection loop. Updates *state* with annotated frames."""
    camera = CameraFeed(settings.camera_url)
    detector = FoodDetector(confidence=settings.confidence_threshold)
    dedup = DedupTracker(
        max_entries=settings.hash_history_size,
        distance_threshold=settings.hash_distance_threshold,
        cooldown_seconds=settings.cooldown_seconds,
    )
    uploader = MealUploader(settings.backend_url, token)

    # Connect WebSocket to signal "vision online"
    ws_url = settings.backend_url.replace("http", "ws", 1) + f"/ws/vision?token={token}"
    ws = websocket.WebSocketApp(ws_url)
    ws_thread = threading.Thread(target=lambda: ws.run_forever(ping_interval=30), daemon=True)
    ws_thread.start()
    logger.info("Vision WebSocket connected to %s", settings.backend_url)

    camera.open()
    logger.info("Pipeline running — watching %s", settings.camera_url)

    last_upload_at = 0.0
    UPLOAD_COOLDOWN = 10.0
    CONFIRM_SECONDS = 2.0

    while not stop_event.is_set():
        raw = camera.read()
        if raw is None:
            time.sleep(0.05)
            continue

        detections = detector.detect(raw)
        annotated = draw_annotations(raw, detections, state)

        with state.lock:
            state.frame = annotated
            state.detections = detections

        if not detections:
            time.sleep(0.1)
            continue

        # Enforce cooldown after a successful upload
        if time.time() - last_upload_at < UPLOAD_COOLDOWN:
            time.sleep(0.1)
            continue

        # Build combined crop
        x1 = min(d.x1 for d in detections)
        y1 = min(d.y1 for d in detections)
        x2 = max(d.x2 for d in detections)
        y2 = max(d.y2 for d in detections)

        h, w = raw.shape[:2]
        margin = 30
        x1 = max(0, x1 - margin)
        y1 = max(0, y1 - margin)
        x2 = min(w, x2 + margin)
        y2 = min(h, y2 + margin)
        crop = raw[y1:y2, x1:x2]

        if dedup.is_duplicate(crop):
            with state.lock:
                state.duplicates_skipped += 1
            time.sleep(0.1)
            continue

        labels = sorted({d.class_name for d in detections})

        # If the latest entry has the same labels, just bump its count
        with state.lock:
            if (state.upload_log
                    and state.upload_log[0].labels == labels
                    and state.upload_log[0].success):
                state.upload_log[0].count += 1
                state.upload_log[0].timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
                state.duplicates_skipped += 1
                dedup.record(crop)
                time.sleep(0.1)
                continue

        # Confirm detection is stable for 3 seconds
        logger.info("Detected %s — confirming for %.0fs…", labels, CONFIRM_SECONDS)
        confirmed = True
        confirm_start = time.time()
        while time.time() - confirm_start < CONFIRM_SECONDS:
            if stop_event.is_set():
                confirmed = False
                break
            check_frame = camera.read()
            if check_frame is not None:
                check_dets = detector.detect(check_frame)
                annotated = draw_annotations(check_frame, check_dets, state)
                with state.lock:
                    state.frame = annotated
                    state.detections = check_dets
                if not check_dets:
                    logger.info("Item disappeared during confirmation — skipping")
                    confirmed = False
                    break
            time.sleep(0.3)

        if not confirmed:
            continue

        # Re-grab the latest frame for the best quality crop
        final_frame = camera.read()
        if final_frame is not None:
            final_dets = detector.detect(final_frame)
            if final_dets:
                x1 = max(0, min(d.x1 for d in final_dets) - margin)
                y1 = max(0, min(d.y1 for d in final_dets) - margin)
                x2 = min(final_frame.shape[1], max(d.x2 for d in final_dets) + margin)
                y2 = min(final_frame.shape[0], max(d.y2 for d in final_dets) + margin)
                crop = final_frame[y1:y2, x1:x2]
                labels = sorted({d.class_name for d in final_dets})

        ok, b64 = uploader.upload(crop, labels=labels)
        entry = UploadEntry(
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
            labels=labels,
            thumbnail_b64=b64,
            success=ok,
        )

        if ok:
            dedup.record(crop)
            last_upload_at = time.time()

        with state.lock:
            if ok:
                state.uploads_count += 1
            state.last_upload_time = time.time()
            state.upload_log.insert(0, entry)
            # Keep the log bounded
            if len(state.upload_log) > 50:
                state.upload_log.pop()

        if ok:
            logger.info("New meal uploaded")
        else:
            logger.warning("Upload failed — will retry on next detection")

        time.sleep(0.1)

    camera.release()
    ws.close()
    logger.info("Pipeline stopped")
