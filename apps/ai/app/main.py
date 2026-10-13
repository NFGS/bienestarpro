"""Sidecar de IA y datos (FastAPI).

Etapa 1 (Fase 4, rebanada 0): esqueleto con el contrato de salud compartido
(packages/contracts). Los frentes de ETL, informes e IA/RAG entran en las
rebanadas 9 y de Fase 5.

Ejecución local:  uvicorn app.main:app --port 3002
"""

from datetime import UTC, datetime

from fastapi import FastAPI

app = FastAPI(title="BienestarPro AI (sidecar)", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    """Contrato de salud compartido con la API core (HealthResponse)."""
    return {
        "status": "ok",
        "service": "ai",
        "version": app.version,
        "timestamp": datetime.now(UTC).isoformat(),
    }
