# BirdNet Agent Guide

## Overview

- `birdnet-client`: React single-page application that renders the BirdNet UI and consumes API responses.
- `server/birdnet-api`: FastAPI backend that wraps the BirdNET AI model analyzer and exposes `/`, `/health`, and `/analyze`.
- `server/express-api`: Express proxy that persists uploads and detections to SQLite while brokering calls to the FastAPI backend.

## Tech Stack

- **birdnet-client**: React 18 + TypeScript (Create React App), Axios for API calls, Formik for form handling, served with `react-scripts` on port `3000`.
- **server/birdnet-api**: Python 3.11 + FastAPI, `birdnetlib` for inference, TensorFlow runtime, Uvicorn ASGI server, depends on `ffmpeg` and `libsndfile` being available.
- **server/express-api**: Node.js 20 + Express, TypeScript compiled via `ts-node-dev`/`tsc`, Axios for proxying, Multer for upload parsing, `better-sqlite3` for persistence.
- **Container base images**: `python:3.11-slim` for the analyzer, `node:20-alpine` for the proxy, and `node:18-alpine` for the client.
- **Shared tooling**: npm workspaces plus Turborepo orchestrate all packages; docker-compose coordinates multi-service development.

## Local Development

1. Run `npm install` at the repository root to install dependencies for all workspaces.
2. Start the orchestrated dev environment with `npm start` from the root for Turbo's interactive dashboard.
3. To run services individually, use `./server/birdnet-api/run.sh`, `npm run dev --workspace server/express-api`, and `npm start --workspace birdnet-client`.
4. Ensure `python3.11` is available locally; if the virtual environment path moves or breaks, rebuild it with `rm -rf server/birdnet-api/venv && ./server/birdnet-api/run.sh`.

## Docker Workflow

- Build and launch the full stack with `docker-compose up --build`.
- The React client is served on http://localhost:3000, the Express proxy on http://localhost:8080, and FastAPI docs on http://localhost:8000/docs (health check at `/health`).

## Configuration

- Backend environment variables live in `server/birdnet-api/config.py` and can be overridden via environment settings.
- Express proxy settings (such as `BIRDNET_API_URL`, `PORT`, `MAX_FILE_SIZE`, `DATABASE_PATH`, `DATABASE_SCHEMA_PATH`) reside in `server/express-api/.env`.
- Frontend environment overrides can be placed in `birdnet-client/.env.development`.

## Data & Persistence

- BirdNET model files are cached at `~/.local/share/birdnetlib` locally or via the `birdnet-models` Docker volume.
- The SQLite database is stored at `server/express-api/data/birdnet.db` and stays out of version control.

## Troubleshooting

- Remove and recreate the Python virtual environment if dependencies drift: `rm -rf server/birdnet-api/venv && ./server/birdnet-api/run.sh`.
- Rerun `npm install` if workspace node modules become inconsistent.
- Confirm `ffmpeg` is installed and on the PATH for audio processing.
- Reset cached models with `docker volume rm birdnet-models` when analyzer downloads get corrupted.
