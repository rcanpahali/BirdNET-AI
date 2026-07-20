import io
import wave

import app as app_module
from analyzer_service import analyzer_service


def _make_wav_bytes(duration_seconds: int = 2, sample_rate: int = 48000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b"\x00\x00" * sample_rate * duration_seconds)
    return buf.getvalue()


def test_health_reports_ready(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "analyzer_ready": True}


def test_readiness_gate_blocks_when_not_ready(client, monkeypatch):
    monkeypatch.setattr(analyzer_service, "_analyzer", None)

    response = client.get("/")

    assert response.status_code == 503
    assert response.json()["error"] == "not_ready"


def test_rejects_unsupported_extension(client):
    response = client.post("/analyze", files={"file": ("clip.txt", b"not audio", "text/plain")})

    assert response.status_code == 400
    assert response.json()["error"] == "unsupported_file_type"


def test_rejects_empty_file(client):
    response = client.post("/analyze", files={"file": ("clip.wav", b"", "audio/wav")})

    assert response.status_code == 400
    assert response.json()["error"] == "empty_upload"


def test_rejects_oversized_file(client, monkeypatch):
    monkeypatch.setattr(app_module, "MAX_FILE_SIZE", 10)

    response = client.post("/analyze", files={"file": ("clip.wav", _make_wav_bytes(), "audio/wav")})

    assert response.status_code == 400
    assert response.json()["error"] == "file_too_large"


def test_analyzes_valid_wav(client):
    response = client.post("/analyze", files={"file": ("clip.wav", _make_wav_bytes(), "audio/wav")})

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "clip.wav"
    assert body["detection_count"] == len(body["detections"])
    assert "analysis_time_seconds" in body
