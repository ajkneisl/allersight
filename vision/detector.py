"""Food detection (YOLOv8) + hand-wash detection (MediaPipe Hand Landmarker)."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO

_FOOD_CLASS_IDS: set[int] = {45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55}
_TABLE_CLASS_ID = 60

log = logging.getLogger("HandWash")


@dataclass
class Detection:
    class_id: int
    class_name: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int


class FoodDetector:
    def __init__(self, model_name: str = "yolov8n.pt", confidence: float = 0.35) -> None:
        self._model = YOLO(model_name)
        self._confidence = confidence

    def detect(self, frame: np.ndarray) -> list[Detection]:
        results = self._model.predict(source=frame, conf=self._confidence, verbose=False)
        detections: list[Detection] = []
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                if cls_id not in _FOOD_CLASS_IDS and cls_id != _TABLE_CLASS_ID:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(Detection(
                    class_id=cls_id, class_name=result.names[cls_id],
                    confidence=float(box.conf[0]),
                    x1=int(x1), y1=int(y1), x2=int(x2), y2=int(y2),
                ))
        return detections


class HandWashDetector:
    """Two hands on screen = hands washed."""

    def __init__(self) -> None:
        model_path = os.path.join(os.path.dirname(__file__), "hand_landmarker.task")
        options = mp.tasks.vision.HandLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=0.3,
            min_hand_presence_confidence=0.3,
            min_tracking_confidence=0.3,
        )
        self._landmarker = mp.tasks.vision.HandLandmarker.create_from_options(options)
        self._ts = 0

    def update(self, frame: np.ndarray) -> bool:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        self._ts += 33
        result = self._landmarker.detect_for_video(
            mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), self._ts,
        )
        n = len(result.hand_landmarks) if result.hand_landmarks else 0
        if n >= 2:
            log.info("🧼 Two hands detected — washing")
        return n >= 2

    def close(self) -> None:
        self._landmarker.close()
