import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from app import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
