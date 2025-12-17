#!/bin/bash
# Helper script to run the backend server without manually activating venv

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Prefer Python 3.11 to match Docker; fall back to default python3
PYTHON_BIN="$(command -v python3.11 || command -v python3)"

if [ -z "$PYTHON_BIN" ]; then
    echo "Error: python3.11 or python3 not found on PATH." >&2
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    "$PYTHON_BIN" -m venv venv
    echo "Installing dependencies..."
    venv/bin/pip install -r requirements.txt
fi

# Run uvicorn using the venv's Python directly
echo "Starting server..."
venv/bin/uvicorn app:app --reload --host 0.0.0.0 --port 8000

