# Bird Sound Analyzer

A web application for analyzing bird sounds using the BirdNET AI. Upload audio files to detect bird species with confidence scores and time ranges.

## Features

- Upload audio files (mp3, wav, flac, m4a, ogg, wma, aac)
- Detect bird species using BirdNET AI-Analyzer
- View detection results with confidence scores and time ranges
- Optional location data (latitude/longitude) for better accuracy
- Automatic model caching
- Docker support

## Tech Stack

- **Backend**: FastAPI (Python 3.9+)
- **Frontend**: React + TypeScript
- **ML Library**: birdnetlib (BirdNET-Analyzer)
- **Containerization**: Docker & Docker Compose

## Quick Start

### Option 1: Docker (Recommended for Production)

**Best for:** Production deployments, consistent environments, team sharing

```bash
docker-compose up --build
```

**First startup:** 2-5 minutes (downloads ~500MB models)  
**Subsequent starts:** 10-30 seconds (models cached)

### Option 2: Local Development (Recommended for Development)

**Best for:** Active development, faster iteration, debugging

**Install dependencies (once):**

```bash
npm install
```

**Run everything (single command):**

```bash
npm start
```

This root command uses `npm-run-all` to launch the BirdNET FastAPI service, the Express proxy, and the React dev server in parallel, keeping logs prefixed and shutting everything down together.

**First startup:** Downloads models (~500MB)  
**Subsequent starts:** Instant (models cached in `~/.local/share/birdnetlib`)

### Access the Application

- **Frontend**: http://localhost:3000
- **Express Proxy API**: http://localhost:8080
- **BirdNET Analyzer API**: http://localhost:8000
- **API Docs (BirdNET)**: http://localhost:8000/docs

## Installation Details

### Prerequisites

- **Docker**: Docker & Docker Compose (for containerized setup)
- **Local**: Python 3.9+, Node.js 18+, ffmpeg, 4GB+ RAM

### Docker Setup

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f birdnet-backend
```

### Local Setup

**Backend (BirdNET, Python):**

1. Install system dependencies:

   ```bash
   # macOS
   brew install ffmpeg libsndfile

   # Ubuntu/Debian
   sudo apt-get install ffmpeg libsndfile1 libsndfile1-dev libasound2-dev

   # Windows: Download ffmpeg from https://ffmpeg.org
   ```

2. Set up Python environment:

   ```bash
   cd backend/birdnet-backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run server:
   ```bash
   ./run.sh  # Easiest - handles venv automatically
   # OR
   uvicorn app:app --reload
   ```

**Express Proxy (Node.js):**

```bash
cd backend/express-backend
npm install
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm start
```

The frontend now uses TypeScript. `react-scripts` handles compilation automatically, so no extra build steps are required when running the dev server.

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

### Optimizations

- Models cached automatically (persist between runs)
- Analyzer initialized once at startup (singleton pattern)
- File size validation
- Proper error handling and logging

## Development

### Running All Services

**Docker:**

```bash
docker-compose up
```

**Local (single terminal):**

```bash
npm install   # first time only
npm start
```

**Local (manual control):**

- Terminal 1: `cd backend/birdnet-backend && ./run.sh`
- Terminal 2: `cd backend/express-backend && npm run dev`
- Terminal 3: `cd frontend && npm start`

**Type checking (optional):**

```bash
cd frontend
npx tsc --noEmit
```

### Helper Scripts

The `backend/birdnet-backend/run.sh` script (macOS/Linux)

- Automatically use the virtual environment
- Create venv if it doesn't exist
- Install dependencies if needed
- Start the server

## Architecture Overview

- **Backend**: FastAPI REST API with BirdNET analyzer (initialized at startup)
- **Proxy**: Express.js layer that forwards requests to the BirdNET analyzer and centralizes future integrations
- **Frontend**: React SPA that communicates with the proxy via HTTP
- **Model Caching**: Models persist in Docker volumes or local directories
- **Stateless**: No database - all analysis performed on-demand

## License

This project uses BirdNET models licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.
