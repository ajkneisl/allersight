"""Uploads a captured frame to the backend as a base64-encoded meal."""

from __future__ import annotations

import base64
import logging

import cv2
import numpy as np
import requests

logger = logging.getLogger(__name__)


def login(backend_url: str, email: str, password: str) -> tuple[str, str]:
    """Authenticate with the backend. Returns (jwt_token, user_email)."""
    resp = requests.post(
        f"{backend_url}/auth/login",
        json={"email": email, "password": password},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["token"], data["email"]


class MealUploader:
    """Sends a JPEG-encoded frame to the backend POST /meals endpoint."""

    def __init__(self, backend_url: str, token: str) -> None:
        self._url = f"{backend_url}/meals"
        self._session = requests.Session()
        self._session.headers.update(
            {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        )

    def upload(self, frame: np.ndarray, labels: list[str] | None = None) -> tuple[bool, str]:
        """Encode *frame* as JPEG, base64 it, and POST to the backend.

        Returns (success, b64_jpeg).
        """
        success, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not success:
            logger.error("Failed to JPEG-encode the frame")
            return False, ""

        b64 = base64.b64encode(buf.tobytes()).decode("ascii")
        description = ", ".join(labels) if labels else "food"

        payload = {
            "image": b64,
            "description": description,
            "mimeType": "image/jpeg",
        }

        try:
            resp = self._session.post(self._url, json=payload, timeout=30)
            if resp.ok:
                logger.info("Uploaded meal — status %s", resp.status_code)
                return True, b64
            else:
                logger.warning("Upload rejected — %s: %s", resp.status_code, resp.text[:200])
                return False, b64
        except requests.RequestException as exc:
            logger.error("Upload failed: %s", exc)
            return False, b64
