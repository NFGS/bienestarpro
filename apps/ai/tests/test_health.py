from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_responde_el_contrato() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "ai"
    assert isinstance(body["version"], str)
    assert isinstance(body["timestamp"], str)
