#!/bin/bash
# Helper script to run the backend server without manually activating venv

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "Installing dependencies..."
    venv/bin/pip install -r requirements.txt
fi

# Run uvicorn using the venv's Python directly
echo "Starting server..."
venv/bin/uvicorn app:app --reload --host 0.0.0.0 --port 8000

