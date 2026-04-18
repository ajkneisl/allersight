"""Food / plate detection using YOLOv8."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from ultralytics import YOLO

# COCO classes that ARE food or hold food (bowl, plate-like).
# 45 = bowl, 46 = banana, 47 = apple, 48 = sandwich, 49 = orange,
# 50 = broccoli, 51 = carrot, 52 = hot dog, 53 = pizza, 54 = donut, 55 = cake
_FOOD_CLASS_IDS: set[int] = {
    45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
}

# Dining table — if we see a table we treat it as "food is present"
# and capture the table region (plates of sushi, etc. sit on it).
_TABLE_CLASS_ID = 60


@dataclass
class Detection:
    """A single detected food region."""

    class_id: int
    class_name: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int


class FoodDetector:
    """Wraps a YOLOv8 model and filters for food-related classes."""

    def __init__(self, model_name: str = "yolov8n.pt", confidence: float = 0.35) -> None:
        self._model = YOLO(model_name)
        self._confidence = confidence

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """Run inference on a BGR frame and return food detections."""
        results = self._model.predict(
            source=frame,
            conf=self._confidence,
            verbose=False,
        )
        detections: list[Detection] = []

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                # Accept food items, bowls, and dining tables
                if cls_id not in _FOOD_CLASS_IDS and cls_id != _TABLE_CLASS_ID:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(
                    Detection(
                        class_id=cls_id,
                        class_name=result.names[cls_id],
                        confidence=float(box.conf[0]),
                        x1=int(x1),
                        y1=int(y1),
                        x2=int(x2),
                        y2=int(y2),
                    )
                )

        return detections
