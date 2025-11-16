# Bird Sound Analyzer

A web application for analyzing bird sounds using the BirdNET library. Upload audio files to detect bird species with confidence scores and time ranges.

## Features

- 🎵 Upload audio files (mp3, wav, flac, m4a, ogg, wma, aac)
- 🐦 Detect bird species using BirdNET-Analyzer
- 📊 View detection results with confidence scores and time ranges
- 🌍 Optional location data (latitude/longitude) for better accuracy
- ⚡ Fast startup with automatic model caching
- 🐳 Docker support for easy deployment
- 🛠️ Local development mode for faster iteration

## Tech Stack

- **Backend**: FastAPI (Python 3.9+)
- **Frontend**: React
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

**Backend:**
```bash
cd backend
./run.sh
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm start
```

**First startup:** Downloads models (~500MB)  
**Subsequent starts:** Instant (models cached in `~/.local/share/birdnetlib`)

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

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
docker-compose logs -f backend
```

### Local Setup

**Backend:**

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
   cd backend
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

**Frontend:**

```bash
cd frontend
npm install
npm start
```

## Usage

1. Open http://localhost:3000 in your browser
2. Click "Choose File" and select an audio file
3. Optionally enter latitude/longitude for location-based filtering
4. Adjust confidence threshold (default: 0.25)
5. Click "Analyze Audio"
6. View detected bird species with confidence scores and time ranges

## API Documentation

### Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check (shows analyzer status)
- `POST /analyze` - Analyze audio file

### Analyze Endpoint

**Request:**
- `file` (required): Audio file
- `lat` (optional): Latitude
- `lon` (optional): Longitude
- `min_conf` (optional): Minimum confidence (0.0-1.0, default: 0.25)

**Response:**
```json
{
  "filename": "sample.mp3",
  "detections": [
    {
      "common_name": "House Finch",
      "scientific_name": "Haemorhous mexicanus",
      "confidence": 0.5744,
      "start_time": 9.0,
      "end_time": 12.0
    }
  ],
  "detection_count": 1,
  "analysis_time_seconds": 2.34
}
```

Interactive API docs available at http://localhost:8000/docs

## Configuration

Configure the backend via environment variables or `backend/config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `DEBUG` | `false` | Enable debug mode |
| `MAX_FILE_SIZE` | `104857600` | Max upload size (100MB) |
| `DEFAULT_MIN_CONFIDENCE` | `0.25` | Default confidence threshold |
| `LOG_LEVEL` | `INFO` | Logging level |

Create `backend/.env` to override defaults (see `backend/.env.example`).

## Project Structure

```
BirdNet/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   ├── run.sh / run.bat    # Helper scripts
│   └── Dockerfile
├── frontend/
│   ├── src/                # React source code
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
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

### Optimizations

- Models cached automatically (persist between runs)
- Analyzer initialized once at startup (singleton pattern)
- File size validation
- Proper error handling and logging

## Development

### Running Both Services

**Docker:**
```bash
docker-compose up
```

**Local (two terminals):**

Terminal 1 - Backend:
```bash
cd backend && ./run.sh
```

Terminal 2 - Frontend:
```bash
cd frontend && npm start
```

### Helper Scripts

The `run.sh` (macOS/Linux)
- Automatically use the virtual environment
- Create venv if it doesn't exist
- Install dependencies if needed
- Start the server

## Architecture Overview

- **Backend**: FastAPI REST API with BirdNET analyzer (initialized at startup)
- **Frontend**: React SPA that communicates with backend via HTTP
- **Model Caching**: Models persist in Docker volumes or local directories
- **Stateless**: No database - all analysis performed on-demand

## Troubleshooting

**"command not found: uvicorn"**
- Use `./run.sh` instead (handles venv automatically)
- Or activate venv: `source venv/bin/activate`

**"ModuleNotFoundError: resampy"**
- Run: `pip install -r requirements.txt`

**Models not loading**
- Check internet connection (first run downloads models)
- Verify ~/.local/share/birdnetlib exists (local) or Docker volume (Docker)

**Port already in use**
- Change `PORT` in `backend/config.py` or use `--port` flag

## License

This project uses BirdNET models licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.

# Quick Installation Guide for macOS

## Install Python Dependencies

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies using pip3:**
   ```bash
   pip3 install -r requirements.txt
   ```
   
   **OR** use python3 -m pip:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

## Install System Dependencies

If you haven't already, install Homebrew and then:

```bash
brew install ffmpeg libsndfile
```

## Run the Backend

After installing dependencies:

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the server
uvicorn app:app --reload
```

## Common Issues

**"command not found: pip"**
- Use `pip3` instead of `pip`
- Or use `python3 -m pip` instead

**"command not found: python3"**
- Install Python 3: `brew install python3`
- Or download from https://www.python.org/downloads/

**"No module named venv"**
- Make sure you're using Python 3.9+: `python3 --version`
- Install Python 3 if needed


