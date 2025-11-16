"""
Configuration settings for the Bird Sound Analyzer API.
"""
import os
from typing import List

# API Configuration
API_TITLE = "Bird Sound Analyzer API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "REST API for analyzing bird sounds using BirdNET"

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# CORS Configuration
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# File Upload Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "104857600"))  # 100MB default
ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.wma', '.aac']

# Analysis Configuration
DEFAULT_MIN_CONFIDENCE = float(os.getenv("DEFAULT_MIN_CONFIDENCE", "0.25"))
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", os.path.expanduser("~/.local/share/birdnetlib"))

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

