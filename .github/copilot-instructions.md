# Copilot Instructions for BirdNet

## System Overview

- Full stack app: FastAPI backend in `server/birdnet-api/app.py`, Express proxy in `server/express-api/src/server.ts`, React SPA in `birdnet-client/src/App.tsx`, orchestrated locally via `docker-compose.yml`.
- Bird detection relies on `birdnetlib.Analyzer`; first run downloads ~500 MB models cached under `~/.local/share/birdnetlib` or Docker volume `birdnet-models`.
- API surface is small (`/`, `/health`, `/analyze`); `/analyze` returns detections array consumed directly by the frontend cards.
- Express proxy persists form metadata and detections to SQLite (default `server/express-api/data/birdnet.db`).

## Backend Patterns

- Analyzer is initialized once during the FastAPI `startup` event and stored in module-level `analyzer`; never re-instantiate per request or the model cache will thrash.
- Uploaded files are saved to a temp path with original extension, validated against `ALLOWED_EXTENSIONS` and `MAX_FILE_SIZE` from `config.py` before processing.
- Use `Recording(analyzer, path, lat=..., lon=..., min_conf=...)` and call `recording.analyze()`; return payloads compatible with existing frontend (fields: `common_name`, `scientific_name`, `confidence`, `start_time`, `end_time`).
- Logging uses Python `logging` configured via `LOG_LEVEL`; prefer `logger.info`/`logger.error` to prints so Docker logs stay structured.

## Configuration & Dependencies

- Runtime knobs live in `server/birdnet-api/config.py` and are overridable via environment variables (`HOST`, `PORT`, `DEBUG`, `DEFAULT_MIN_CONFIDENCE`, etc.); reflect new settings there when adding features.
- Express proxy configuration lives in `server/express-api/.env` (`BIRDNET_API_URL`, `PORT`, `MAX_FILE_SIZE`, `DATABASE_PATH`, `DATABASE_SCHEMA_PATH`) and should stay in sync with docker-compose values.
- System dependencies: ffmpeg + libsndfile (see `guide.md` and backend Dockerfile). Ensure docs mention them when adding audio handling features.
- Requirements pinned in `server/birdnet-api/requirements.txt`; tensorflow/librosa versions must stay compatible with the target Python (currently 3.11 in Docker, venv via `run.sh`).

## Running & Debugging

- Easiest dev loop: `npm start` from repo root. Turborepo runs the FastAPI backend, Express proxy, and React dev server under a single TUI.
- Manual dev loop: `cd server/birdnet-api && ./run.sh`, `cd server/express-api && npm run dev`, `cd birdnet-client && npm start` in separate terminals.
- For Docker parity: `docker-compose up --build`; backend healthcheck waits up to 60 s for model download before the frontend starts.
- API docs available at `http://localhost:8000/docs`; health probe at `/health` reports analyzer readiness—useful before hitting `/analyze`.
- Temporary files are cleaned in a `finally` block; preserve that pattern when adding background jobs or async tasks.

## Frontend Notes

- React app uses Axios against `REACT_APP_API_URL` (defaults to `http://localhost:8080`); configure env var in Docker for cross-container calls.
- UI expects `detection_count` and `detections` array in response; keep payload backwards-compatible or gate changes behind new keys.
- Styling lives in `birdnet-client/src/App.css`; no component library in use, so maintain the simple card layout if adding new result metadata.

## Adding Features Safely

- When introducing new endpoints, surface config flags in `server/birdnet-api/config.py`, document them in `README.md`, and reuse the global analyzer where possible. Keep Express proxy routes thin and forward-compatible with the frontend contract.
- Preserve file-type and size validation to avoid analyzer crashes; extend `ALLOWED_EXTENSIONS` only after confirming BirdNET support.
- For long-running tasks, consider background workers but ensure temporary files are still removed and logs clarify processing stages.
- Tests are not present; if you add any, call out the command needed to run them in this guide so others inherit the workflow.

## Deployment & Ops

- Docker images baked from `server/birdnet-api/Dockerfile` (python:3.11-slim), `server/express-api/Dockerfile` (node:20-alpine), and `birdnet-client/Dockerfile` (node:18-alpine); model cache persists via named volume and Express SQLite data lives in `server/express-api/data` (bind-mounted to `/app/data`).
- To reset cached models, remove `birdnet-models` volume (`docker volume rm birdnet-models`) or delete `~/.local/share/birdnetlib` locally.
- Monitor startup logs for analyzer readiness messages (`✓ BirdNET Analyzer ready!`); failures there typically point to missing system deps or download issues.
