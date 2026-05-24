from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "smartdesk",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="ingest_document")
def ingest_document(document_id: str) -> dict:
    """Background job to parse → chunk → embed → store a document.

    Implemented fully in Week 2.
    """
    return {"document_id": document_id, "status": "stub"}
