FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    libasound2-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the lockfile first for better Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py config.py analyzer_service.py errors.py ./

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
