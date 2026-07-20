"""Runtime configuration for the BirdNET inference service."""
import os

API_TITLE = "BirdNET Inference Service"
API_VERSION = "2.0.0"
API_DESCRIPTION = (
    "Internal-only service that runs BirdNET inference on an uploaded audio file. "
    "Not exposed to the browser -- called exclusively by the Express API."
)

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(100 * 1024 * 1024)))  # 100MB default
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".wma", ".aac"}

DEFAULT_MIN_CONFIDENCE = float(os.getenv("DEFAULT_MIN_CONFIDENCE", "0.25"))

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Read/write granularity while streaming an upload to disk.
UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1MB
