#!/usr/bin/env python3
"""AllerSight for Businesses — headless CLI mode."""

from __future__ import annotations

import logging
import signal
import threading

from config import Settings
from pipeline import FrameState, run_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s")
logger = logging.getLogger("allersight")


def main() -> None:
    settings = Settings()  # type: ignore[call-arg]
    state = FrameState()
    stop = threading.Event()

    def _handle_signal(sig: int, _frame: object) -> None:
        logger.info("Received signal %s — shutting down", sig)
        stop.set()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    logger.info("AllerSight for Businesses running — watching %s", settings.camera_url)
    run_pipeline(settings, state, stop)
    logger.info("AllerSight stopped")


if __name__ == "__main__":
    main()
