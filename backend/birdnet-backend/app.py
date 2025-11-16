"""
BirdNET-AI Analyzer API

A FastAPI application for analyzing bird sounds using BirdNET.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from birdnetlib.exceptions import AudioFormatError
from datetime import datetime
import os
import tempfile
import uvicorn
import logging
import time
from typing import Optional

from config import (
    API_TITLE,
    API_VERSION,
    API_DESCRIPTION,
    CORS_ORIGINS,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS,
    DEFAULT_MIN_CONFIDENCE,
    LOG_LEVEL,
    HOST,
    PORT,
    DEBUG,
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzer once at startup
analyzer = None

@app.on_event("startup")
async def startup_event():
    global analyzer
    import time
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("Initializing BirdNET Analyzer...")
    logger.info("This may take 1-2 minutes on first run (downloading models)")
    logger.info("Models will be cached for faster subsequent starts")
    logger.info("=" * 60)
    
    try:
        analyzer = Analyzer()
        elapsed = time.time() - start_time
        logger.info("=" * 60)
        logger.info(f"✓ BirdNET Analyzer ready! (took {elapsed:.1f}s)")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"Failed to initialize analyzer: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "BirdNET-AI Analyzer API"}

@app.get("/health")
async def health():
    status = "healthy" if analyzer is not None else "initializing"
    return {
        "status": status,
        "analyzer_ready": analyzer is not None,
        "message": "Analyzer ready" if analyzer is not None else "Analyzer initializing (downloading models on first run)"
    }

@app.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    lat: Optional[float] = Query(None, description="Latitude for location-based filtering"),
    lon: Optional[float] = Query(None, description="Longitude for location-based filtering"),
    min_conf: float = Query(DEFAULT_MIN_CONFIDENCE, ge=0.0, le=1.0, description="Minimum confidence threshold (0.0-1.0)")
):
    """
    Analyze an audio file for bird sounds.
    
    This endpoint accepts an audio file and returns detected bird species
    with their confidence scores and time ranges.
    
    **Parameters:**
    - **file**: Audio file (mp3, wav, flac, m4a, ogg, wma, aac)
    - **lat**: Optional latitude for location-based species filtering
    - **lon**: Optional longitude for location-based species filtering  
    - **min_conf**: Minimum confidence threshold (0.0-1.0, default: 0.25)
    
    **Returns:**
    - JSON object with filename, detections array, and detection count
    """
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Analyzer not ready. Please wait for initialization to complete."
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    tmp_file_path = None
    analysis_start_time = None
    
    try:
        # Read file content
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        # Check file size
        file_size = len(content)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
            )
        
        # Create temporary file to save uploaded audio
        # Keep original extension - birdnetlib will handle format conversion
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
            tmp_file.flush()
            os.fsync(tmp_file.fileno())
        
        logger.info(f"Processing file: {file.filename} ({file_size:,} bytes)")
        
        # Verify file exists and has content
        if not os.path.exists(tmp_file_path) or os.path.getsize(tmp_file_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to save uploaded file")
        
        # Perform analysis
        analysis_start_time = time.time()
        try:
            recording = Recording(
                analyzer,
                tmp_file_path,
                lat=lat,
                lon=lon,
                date=datetime.now(),
                min_conf=min_conf,
            )
            recording.analyze()
            
            analysis_time = time.time() - analysis_start_time
            logger.info(
                f"Analysis complete: {len(recording.detections)} detections "
                f"in {analysis_time:.2f}s"
            )
            
            # Return detections
            return {
                "filename": file.filename,
                "detections": recording.detections,
                "detection_count": len(recording.detections),
                "analysis_time_seconds": round(analysis_time, 2)
            }
            
        except AudioFormatError as e:
            logger.error(f"Audio format error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Unable to read audio file. Please ensure the file is a valid audio format. Error: {str(e)}"
            )
        except Exception as analysis_error:
            logger.error(f"Analysis error: {str(analysis_error)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error during analysis: {str(analysis_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if tmp_file_path and os.path.exists(tmp_file_path):
            try:
                os.unlink(tmp_file_path)
                logger.debug(f"Cleaned up temporary file: {tmp_file_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp file: {cleanup_error}")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level=LOG_LEVEL.lower()
    )

