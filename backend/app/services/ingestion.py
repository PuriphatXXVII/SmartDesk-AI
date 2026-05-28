"""Document ingestion orchestration: parse -> chunk -> embed -> store.

Runs synchronously; the upload endpoint schedules it via FastAPI BackgroundTasks
so the HTTP response returns immediately. For heavy production workloads this
same function is what the Celery task in app/worker.py calls.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import delete

from app.core.db import SessionLocal
from app.models import DocumentChunk, KnowledgeDocument
from app.services.chunking import chunk_text
from app.services.embeddings import embed_texts
from app.services.parsing import extract_text

logger = logging.getLogger(__name__)


def ingest_document(document_id: UUID, raw: bytes, content_type: str | None, filename: str | None) -> None:
    """Process one document end-to-end and update its status."""
    db = SessionLocal()
    try:
        doc = db.get(KnowledgeDocument, document_id)
        if doc is None:
            logger.warning("ingest: document %s not found", document_id)
            return

        doc.status = "processing"
        db.commit()

        text = extract_text(raw, content_type=content_type, filename=filename)
        chunks = chunk_text(text)

        if not chunks:
            doc.status = "failed"
            doc.chunk_count = 0
            db.commit()
            return

        # Re-embed cleanly: drop any existing chunks for idempotent re-ingestion.
        db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))

        embeddings = embed_texts(chunks)
        for idx, (content, vector) in enumerate(zip(chunks, embeddings, strict=True)):
            db.add(
                DocumentChunk(
                    document_id=doc.id,
                    org_id=doc.org_id,
                    content=content,
                    embedding=vector,
                    chunk_index=idx,
                )
            )

        doc.chunk_count = len(chunks)
        doc.status = "ready"
        db.commit()
        logger.info("ingest: document %s ready (%d chunks)", document_id, len(chunks))
    except Exception:
        logger.exception("ingest: failed for %s", document_id)
        db.rollback()
        doc = db.get(KnowledgeDocument, document_id)
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()
