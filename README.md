# BirdNET-AI Analyzer

A web application for analyzing bird sounds using the BirdNET AI model. Upload audio files to detect bird species with confidence scores and time ranges.

## References

- [BirdNET-Analyzer](https://github.com/birdnet-team/BirdNET-Analyzer) – upstream analyzer and model definitions.
- [birdnetlib](https://pypi.org/project/birdnetlib/) – Python interface used to drive the analyzer.
- [TensorFlow](https://www.tensorflow.org/) – machine learning runtime leveraged by birdnetlib/BirdNET.

## Tech Stack

- **Frontend**: React + TypeScript (Create React App)
- **Proxy API**: Express.js + TypeScript + SQLite (better-sqlite3)
- **Analyzer Service**: FastAPI + birdnetlib + TensorFlow
- **Tooling**: npm workspaces, Turborepo, Docker, docker-compose

## Quick Start

```bash
docker-compose up --build
```

**First startup:** 2-5 minutes (downloads ~500MB models)  
**Subsequent starts:** 10-30 seconds (models cached)

### Access the Application

- **Frontend**: http://localhost:3000
- **Express Proxy API**: http://localhost:8080
- **BirdNET Analyzer API**: http://localhost:8000
- **API Docs (BirdNET)**: http://localhost:8000/docs

## Installation Details

### Docker

1. Ensure Docker Desktop (or engine) and docker-compose are available.
2. From the repo root run `docker-compose up --build`.
3. Visit the frontend at http://localhost:3000 once the containers report ready.

### Local

Minimum versions: Python 3.9+, Node.js 18+, and ffmpeg installed on your PATH.

```bash
# Install all workspace dependencies
npm install

# Launch FastAPI, Express proxy, and React dev server with Turbo's TUI
npm start

# (Optional) run services individually
server/birdnet-api/run.sh
npm run dev --workspace server/express-api
npm start --workspace birdnet-client
```

## Performance & Model Caching

### Model Loading

- **First run**: Downloads ~500MB models (2-5 minutes)
- **Subsequent runs**:
  - Docker: 10-30 seconds (cached in volume)
  - Local: Instant (cached in `~/.local/share/birdnetlib`)

### Cache Management

**Docker:**

```bash
docker-compose down
docker volume rm birdnet-models  # Clear cache
docker-compose up --build
```

**Local:**

```bash
rm -rf ~/.local/share/birdnetlib  # Clear cache
```

**Type checking (optional):**

```bash
cd birdnet-client
npx tsc --noEmit
```

## Data & Persistence

- The Express proxy stores every successful analysis and its detections in a SQLite database (default path `server/express-api/data/birdnet.db`).
- Configure the path via the `DATABASE_PATH` environment variable in `server/express-api/.env` or Docker Compose; relative paths resolve from the project root.
- Schema migrations live in `server/express-api/schema.sql`.
- The `data/` directory is ignored by Git. Docker Compose bind-mounts `./server/express-api/data` into the container so your history survives rebuilds while remaining local.

## Architecture Overview

- **Backend**: FastAPI REST API with BirdNET analyzer (initialized at startup)
- **Proxy**: Express.js layer that forwards requests to the BirdNET analyzer, persists results in SQLite, and centralizes future integrations
- **Frontend**: React SPA that communicates with the proxy via HTTP
- **Model Caching**: Models persist in Docker volumes or local directories
- **Persistence**: SQLite database (`server/express-api/data/birdnet.db` by default, bind-mounted into the container) records analyses and detections

## License

This repository is published for personal, research, and educational use only and carries no commercial grant. The BirdNET models remain licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License, so any deployment must stay non-commercial, provide attribution, and preserve the same license for derivative model artifacts.
