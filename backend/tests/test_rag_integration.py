"""End-to-end RAG test against real Postgres + pgvector.

Skipped automatically when Postgres isn't reachable (e.g. CI without a DB), so
it never breaks the pipeline — run it locally with `docker compose up postgres`.
"""

import uuid

import pytest
from sqlalchemy import text

from app.core.config import get_settings

settings = get_settings()


def _postgres_available() -> bool:
    if not settings.database_url.startswith("postgresql"):
        return False
    try:
        from app.core.db import engine

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _postgres_available(), reason="Postgres+pgvector not reachable"
)


@pytest.fixture
def org():
    from app.core.db import SessionLocal
    from app.models import DocumentChunk, KnowledgeDocument, Organization

    db = SessionLocal()
    o = Organization(name="RAG Test Org", slug=f"rag-test-{uuid.uuid4().hex[:8]}", plan="free")
    db.add(o)
    db.commit()
    db.refresh(o)
    yield o
    # cleanup
    doc_ids = [d.id for d in db.query(KnowledgeDocument).filter_by(org_id=o.id).all()]
    for did in doc_ids:
        db.query(DocumentChunk).filter_by(document_id=did).delete()
    db.query(KnowledgeDocument).filter_by(org_id=o.id).delete()
    db.delete(o)
    db.commit()
    db.close()


def test_full_rag_loop(org) -> None:
    from app.core.db import SessionLocal
    from app.models import KnowledgeDocument
    from app.rag.pipeline import answer, retrieve
    from app.services.ingestion import ingest_document

    db = SessionLocal()
    try:
        doc = KnowledgeDocument(
            org_id=org.id, source_type="text", title="Refund Policy", status="pending"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        doc_id = doc.id
    finally:
        db.close()

    sample = (
        "Our refund policy allows full refunds within 30 days of purchase. "
        "To request a refund, email support@example.com with your order number. "
        "Annual plans are refundable on a pro-rata basis after the first 30 days."
    )
    ingest_document(doc_id, sample.encode("utf-8"), "text/plain", "refund.txt")

    db = SessionLocal()
    try:
        refreshed = db.get(KnowledgeDocument, doc_id)
        assert refreshed.status == "ready"
        assert refreshed.chunk_count >= 1

        chunks = retrieve(db, org.id, "how do I get a refund?")
        assert len(chunks) >= 1
        assert "refund" in chunks[0].content.lower()

        # Fallback answer (no real Anthropic key) should still reference the content.
        resp = answer(db, org.id, "how do I get a refund?")
        assert resp.citations
        assert resp.confidence > 0
    finally:
        db.close()
