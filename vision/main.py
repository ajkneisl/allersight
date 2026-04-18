#!/usr/bin/env python3
"""AllerVision – headless CLI mode."""

from __future__ import annotations

import getpass
import logging
import signal
import threading

from config import Settings
from pipeline import FrameState, run_pipeline
from uploader import login

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("allervision")


def main() -> None:
    settings = Settings()  # type: ignore[call-arg]

    email = input("Email: ").strip()
    password = getpass.getpass("Password: ")

    logger.info("Logging in to %s …", settings.backend_url)
    token, user_email = login(settings.backend_url, email, password)
    logger.info("Welcome back, %s", user_email)

    state = FrameState()
    stop = threading.Event()

    def _handle_signal(sig: int, _frame: object) -> None:
        logger.info("Received signal %s — shutting down", sig)
        stop.set()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    logger.info("AllerVision running (headless) — watching %s", settings.camera_url)
    run_pipeline(settings, state, stop, token=token)
    logger.info("AllerVision stopped")


if __name__ == "__main__":
    main()
