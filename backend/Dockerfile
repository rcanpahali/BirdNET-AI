FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    libasound2-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies (cache this layer)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Create directory for model cache (persisted via volume)
RUN mkdir -p /app/models

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

