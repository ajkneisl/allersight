"""Configuration loaded from environment variables / .env file."""

from pydantic_settings import BaseSettings


# Common allergens mapped from COCO detection class names
ALLERGEN_MAP: dict[str, list[str]] = {
    "sandwich": ["gluten"],
    "hot dog": ["gluten"],
    "pizza": ["gluten", "dairy"],
    "cake": ["gluten", "dairy", "eggs"],
    "donut": ["gluten", "dairy", "eggs"],
}


class Settings(BaseSettings):
    # URL of the live camera feed (MJPEG / RTSP / HTTP snapshot)
    camera_url: str = ""

    # Detection tuning
    confidence_threshold: float = 0.45

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
