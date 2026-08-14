"""Wraps the BirdNET analyzer singleton -- loaded once at startup, reused for every request."""
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from birdnetlib.exceptions import AudioFormatError

from errors import AudioDecodingError

logger = logging.getLogger(__name__)


class AnalyzerService:
    def __init__(self) -> None:
        self._analyzer: Optional[Analyzer] = None

    @property
    def ready(self) -> bool:
        return self._analyzer is not None

    def load(self) -> None:
        logger.info("Loading BirdNET analyzer...")
        start = time.time()
        self._analyzer = Analyzer()
        logger.info("BirdNET analyzer ready (%.2fs)", time.time() - start)

    def analyze(
        self,
        file_path: Path,
        lat: Optional[float],
        lon: Optional[float],
        min_conf: float,
    ) -> dict:
        if self._analyzer is None:
            raise RuntimeError("Analyzer used before it was loaded")

        # birdnetlib only *sets* a location-based species allow-list on the shared
        # Analyzer when lat/lon are given -- it never clears it otherwise, so a prior
        # request's location silently keeps filtering every later request that has none.
        if lat is None or lon is None:
            self._analyzer.custom_species_list = []

        start = time.time()
        try:
            recording = Recording(
                self._analyzer,
                str(file_path),
                lat=lat,
                lon=lon,
                date=datetime.now(),
                min_conf=min_conf,
            )
            recording.analyze()
        except AudioFormatError as exc:
            raise AudioDecodingError(
                f"Unable to read audio file. Please ensure the file is a valid audio format. Error: {exc}"
            ) from exc

        elapsed = time.time() - start
        return {
            "detections": recording.detections,
            "detection_count": len(recording.detections),
            "analysis_time_seconds": round(elapsed, 2),
            "duration_seconds": round(recording.duration, 2) if recording.duration is not None else None,
        }


analyzer_service = AnalyzerService()
