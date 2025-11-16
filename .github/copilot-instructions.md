# Copilot Instructions for BirdNet

## System Overview

- Full stack app: FastAPI backend in `backend/app.py`, React SPA in `frontend/src/App.js`, orchestrated locally via `docker-compose.yml`.
- Bird detection relies on `birdnetlib.Analyzer`; first run downloads ~500 MB models cached under `~/.local/share/birdnetlib` or Docker volume `birdnet-models`.
- API surface is small (`/`, `/health`, `/analyze`); `/analyze` returns detections array consumed directly by the frontend cards.
- No database or persistence; every request analyzes the uploaded file on demand.

## Backend Patterns

- Analyzer is initialized once during the FastAPI `startup` event and stored in module-level `analyzer`; never re-instantiate per request or the model cache will thrash.
- Uploaded files are saved to a temp path with original extension, validated against `ALLOWED_EXTENSIONS` and `MAX_FILE_SIZE` from `config.py` before processing.
- Use `Recording(analyzer, path, lat=..., lon=..., min_conf=...)` and call `recording.analyze()`; return payloads compatible with existing frontend (fields: `common_name`, `scientific_name`, `confidence`, `start_time`, `end_time`).
- Logging uses Python `logging` configured via `LOG_LEVEL`; prefer `logger.info`/`logger.error` to prints so Docker logs stay structured.

## Configuration & Dependencies

- Runtime knobs live in `backend/config.py` and are overridable via environment variables (`HOST`, `PORT`, `DEBUG`, `DEFAULT_MIN_CONFIDENCE`, etc.); reflect new settings there when adding features.
- System dependencies: ffmpeg + libsndfile (see `guide.md` and backend Dockerfile). Ensure docs mention them when adding audio handling features.
- Requirements pinned in `backend/requirements.txt`; tensorflow/librosa versions must stay compatible with the target Python (currently 3.11 in Docker, venv via `run.sh`).

## Running & Debugging

- Easiest dev loop: `cd backend && ./run.sh` (auto-creates venv, installs deps, runs uvicorn) plus `cd frontend && npm start` in another terminal.
- For Docker parity: `docker-compose up --build`; backend healthcheck waits up to 60 s for model download before the frontend starts.
- API docs available at `http://localhost:8000/docs`; health probe at `/health` reports analyzer readiness—useful before hitting `/analyze`.
- Temporary files are cleaned in a `finally` block; preserve that pattern when adding background jobs or async tasks.

## Frontend Notes

- React app uses Axios against `REACT_APP_API_URL` (defaults to `http://localhost:8000`); configure env var in Docker for cross-container calls.
- UI expects `detection_count` and `detections` array in response; keep payload backwards-compatible or gate changes behind new keys.
- Styling lives in `frontend/src/App.css`; no component library in use, so maintain the simple card layout if adding new result metadata.

## Adding Features Safely

- When introducing new endpoints, surface config flags in `config.py`, document them in `README.md`, and reuse global analyzer where possible.
- Preserve file-type and size validation to avoid analyzer crashes; extend `ALLOWED_EXTENSIONS` only after confirming BirdNET support.
- For long-running tasks, consider background workers but ensure temporary files are still removed and logs clarify processing stages.
- Tests are not present; if you add any, call out the command needed to run them in this guide so others inherit the workflow.

## Deployment & Ops

- Docker images baked from `backend/Dockerfile` (python:3.11-slim) and `frontend/Dockerfile` (node:18-alpine); model cache persists via named volume.
- To reset cached models, remove `birdnet-models` volume (`docker volume rm birdnet-models`) or delete `~/.local/share/birdnetlib` locally.
- Monitor startup logs for analyzer readiness messages (`✓ BirdNET Analyzer ready!`); failures there typically point to missing system deps or download issues.
