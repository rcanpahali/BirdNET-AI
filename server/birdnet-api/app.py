"""
BirdNET Inference Service

Internal-only FastAPI service: accepts an audio file plus lat/lon/min_conf,
runs BirdNET inference, and returns detections. No persistence, no CORS --
the Express API is the only caller and reaches it over the internal network.
"""
import logging
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Query, Request, UploadFile
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from analyzer_service import analyzer_service
from config import (
    ALLOWED_EXTENSIONS,
    API_DESCRIPTION,
    API_TITLE,
    API_VERSION,
    DEBUG,
    DEFAULT_MIN_CONFIDENCE,
    HOST,
    LOG_LEVEL,
    MAX_FILE_SIZE,
    PORT,
    UPLOAD_CHUNK_SIZE,
)
from errors import AnalyzerServiceError, EmptyUpload, FileTooLarge, UnsupportedFileType

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    analyzer_service.load()
    yield


app = FastAPI(title=API_TITLE, version=API_VERSION, description=API_DESCRIPTION, lifespan=lifespan)


@app.middleware("http")
async def readiness_gate(request: Request, call_next):
    if request.url.path != "/health" and not analyzer_service.ready:
        return JSONResponse(
            status_code=503,
            content={"error": "not_ready", "message": "Analyzer is still initializing"},
        )
    return await call_next(request)


@app.exception_handler(AnalyzerServiceError)
async def analyzer_service_error_handler(_request: Request, exc: AnalyzerServiceError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.error_code, "message": exc.message})


@app.exception_handler(Exception)
async def unhandled_error_handler(_request: Request, exc: Exception):
    logger.error("Unhandled error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "An unexpected error occurred"},
    )


@app.get("/")
async def root():
    return {"message": API_TITLE}


@app.get("/health")
async def health():
    ready = analyzer_service.ready
    return {"status": "healthy" if ready else "initializing", "analyzer_ready": ready}


@app.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    lat: Optional[float] = Query(None, description="Latitude for location-based filtering"),
    lon: Optional[float] = Query(None, description="Longitude for location-based filtering"),
    min_conf: float = Query(DEFAULT_MIN_CONFIDENCE, ge=0.0, le=1.0),
):
    if not file.filename:
        raise UnsupportedFileType("No filename provided")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileType(
            f"Unsupported file format: {file_ext}. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    tmp_path: Optional[Path] = None
    try:
        tmp_path = await _stream_to_temp_file(file, file_ext)
        result = await run_in_threadpool(
            analyzer_service.analyze, tmp_path, lat=lat, lon=lon, min_conf=min_conf
        )
        logger.info("Analyzed %s: %d detection(s)", file.filename, result["detection_count"])
        return {"filename": file.filename, **result}
    finally:
        if tmp_path is not None:
            tmp_path.unlink(missing_ok=True)


async def _stream_to_temp_file(file: UploadFile, suffix: str) -> Path:
    """Write the upload to disk in chunks instead of buffering it into one big `bytes` object."""
    total_bytes = 0
    fd, tmp_name = tempfile.mkstemp(suffix=suffix)
    tmp_path = Path(tmp_name)

    try:
        with os.fdopen(fd, "wb") as tmp_file:
            while chunk := await file.read(UPLOAD_CHUNK_SIZE):
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE:
                    raise FileTooLarge(f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024:.1f}MB")
                tmp_file.write(chunk)
            tmp_file.flush()
            os.fsync(tmp_file.fileno())
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise

    if total_bytes == 0:
        tmp_path.unlink(missing_ok=True)
        raise EmptyUpload("Uploaded file is empty")

    return tmp_path


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host=HOST, port=PORT, reload=DEBUG, log_level=LOG_LEVEL.lower())
