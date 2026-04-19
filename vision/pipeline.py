"""AllerSight for Businesses — ingredient tracking pipeline.

Detects ingredients on camera, stacks them into a persistent log, and only
clears when hand-washing is confirmed: two hands visible on screen moving
in circular motions together.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

import cv2
import numpy as np

from camera import CameraFeed
from config import ALLERGEN_MAP, Settings
from detector import Detection, FoodDetector, HandWashDetector

logger = logging.getLogger("allersight.pipeline")

_BOX_COLOUR = (0, 255, 120)
_ALLERGEN_COLOUR = (0, 80, 255)
_TEXT_COLOUR = (255, 255, 255)
_BG_COLOUR = (0, 200, 100)
_CLEAR_COLOUR = (255, 180, 0)


@dataclass
class IngredientEntry:
    name: str
    allergens: list[str]
    first_seen: str
    count: int = 1


@dataclass
class ClearEvent:
    timestamp: str
    ingredients_cleared: int


@dataclass
class FrameState:
    frame: np.ndarray | None = None
    detections: list[Detection] = field(default_factory=list)
    ingredients: list[IngredientEntry] = field(default_factory=list)
    clear_log: list[ClearEvent] = field(default_factory=list)
    last_clear_time: float = 0.0
    lock: threading.Lock = field(default_factory=threading.Lock)


def _allergens_for(name: str) -> list[str]:
    return ALLERGEN_MAP.get(name.lower(), [])


def draw_annotations(frame: np.ndarray, detections: list[Detection], state: FrameState) -> np.ndarray:
    annotated = frame.copy()
    for d in detections:
        allergens = _allergens_for(d.class_name)
        colour = _ALLERGEN_COLOUR if allergens else _BOX_COLOUR
        cv2.rectangle(annotated, (d.x1, d.y1), (d.x2, d.y2), colour, 2)

        label = d.class_name
        if allergens:
            label += f" ⚠ {','.join(allergens)}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        bg = _ALLERGEN_COLOUR if allergens else _BG_COLOUR
        cv2.rectangle(annotated, (d.x1, d.y1 - th - 8), (d.x1 + tw + 6, d.y1), bg, -1)
        cv2.putText(annotated, label, (d.x1 + 3, d.y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, _TEXT_COLOUR, 1)

    # Status bar
    h, w = annotated.shape[:2]
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, 32), (40, 40, 40), -1)
    cv2.addWeighted(overlay, 0.7, annotated, 0.3, 0, annotated)

    with state.lock:
        n_ing = len(state.ingredients)
        n_allergens = sum(1 for i in state.ingredients if i.allergens)

    status = f"Ingredients: {n_ing}  |  Allergens flagged: {n_allergens}  |  Detections: {len(detections)}"
    cv2.putText(annotated, status, (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, _TEXT_COLOUR, 1)
    return annotated


def run_pipeline(settings: Settings, state: FrameState, stop_event: threading.Event) -> None:
    """Core detection loop — stacks ingredients locally, clears on hand-wash."""
    camera = CameraFeed(settings.camera_url)
    detector = FoodDetector(confidence=settings.confidence_threshold)

    camera.open()
    logger.info("Pipeline running — watching %s", settings.camera_url)

    # ── Hand-wash detection via MediaPipe Hands ──────────────────────
    # Detects two hands on screen using MediaPipe.  When both hands are
    # close together and moving in circular motions (rubbing), the
    # ingredient queue is cleared.
    wash_detector = HandWashDetector()
    seen_recently: set[str] = set()

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

        # Stack ingredients (detections are food-only)
        for d in detections:
            name = d.class_name
            if name in seen_recently:
                continue
            seen_recently.add(name)
            allergens = _allergens_for(name)
            with state.lock:
                existing = next((i for i in state.ingredients if i.name == name), None)
                if existing:
                    existing.count += 1
                else:
                    state.ingredients.append(IngredientEntry(
                        name=name, allergens=allergens,
                        first_seen=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    ))
                    if allergens:
                        logger.warning("⚠ ALLERGEN: %s contains %s", name, ", ".join(allergens))
                    else:
                        logger.info("Added ingredient: %s", name)

        # Check for hand-washing circular motion
        if wash_detector.update(raw):
            with state.lock:
                if state.ingredients:
                    count = len(state.ingredients)
                    state.clear_log.insert(0, ClearEvent(
                        timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                        ingredients_cleared=count,
                    ))
                    if len(state.clear_log) > 20:
                        state.clear_log.pop()
                    state.ingredients.clear()
                    state.last_clear_time = time.time()
                    logger.info("🧼 Hand washing detected (circular motion) — cleared %d ingredients", count)
            seen_recently.clear()

        time.sleep(0.1)

    camera.release()
    wash_detector.close()
    logger.info("Pipeline stopped")
