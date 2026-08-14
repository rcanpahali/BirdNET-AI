#!/bin/bash
# Helper script to run the backend server without manually activating venv
set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Pinned to Python 3.13 -- must match the Docker image and requirements.txt's
# lockfile exactly, otherwise local dev and Docker can resolve different
# dependency graphs. Fails loudly instead of silently falling back to a
# different interpreter.
PYTHON_BIN="$(command -v python3.13 || true)"

if [ -z "$PYTHON_BIN" ]; then
    echo "Error: python3.13 not found on PATH." >&2
    echo "This service is pinned to Python 3.13 to match the Docker image and requirements.txt." >&2
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    "$PYTHON_BIN" -m venv venv
    echo "Installing locked dependencies..."
    venv/bin/pip install -r requirements.txt
fi

# Run uvicorn using the venv's Python directly
echo "Starting server..."
venv/bin/uvicorn app:app --reload --host 0.0.0.0 --port 8000

