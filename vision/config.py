"""Configuration loaded from environment variables / .env file."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # URL of the live camera feed (MJPEG / RTSP / HTTP snapshot)
    camera_url: str

    # Backend base URL
    backend_url: str = "http://localhost:8080"

    # ── Detection tuning ─────────────────────────────────────────────
    confidence_threshold: float = 0.45
    cooldown_seconds: int = 30
    hash_distance_threshold: int = 12
    hash_history_size: int = 64
    poll_interval: float = 1.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
