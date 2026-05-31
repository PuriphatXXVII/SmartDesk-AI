from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_org, get_db
from app.core.security import limiter
from app.models import DocumentChunk, KnowledgeDocument, Organization
from app.services.ingestion import ingest_document
from app.services.storage import delete_file, save_file

router = APIRouter()
settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/html",
}
ALLOWED_EXTS = {".pdf", ".docx", ".txt", ".md", ".markdown", ".html", ".htm"}


def _doc_to_dict(doc: KnowledgeDocument) -> dict:
    return {
        "id": str(doc.id),
        "title": doc.title,
        "source_type": doc.source_type,
        "status": doc.status,
        "chunk_count": doc.chunk_count,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@router.get("/documents")
@limiter.limit("60/minute")
def list_documents(
    request: Request,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> list[dict]:
    docs = db.scalars(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.org_id == org.id)
        .order_by(KnowledgeDocument.created_at.desc())
    ).all()
    return [_doc_to_dict(d) for d in docs]


@router.post("/documents/upload")
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    background: BackgroundTasks,
    file: UploadFile = File(...),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    max_bytes = settings.max_upload_mb * 1024 * 1024
    too_large = HTTPException(
        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        detail=f"File too large (max {settings.max_upload_mb}MB)",
    )
    # Reject by declared size first, then read in chunks with a hard cap so a
    # huge (or size-spoofed) upload can't be buffered fully into memory.
    if file.size is not None and file.size > max_bytes:
        raise too_large
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(1024 * 1024):
        total += len(chunk)
        if total > max_bytes:
            raise too_large
        chunks.append(chunk)
    raw = b"".join(chunks)

    ext = ""
    if file.filename and "." in file.filename:
        ext = file.filename[file.filename.rfind(".") :].lower()
    if file.content_type not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type or ext}",
        )

    doc = KnowledgeDocument(
        org_id=org.id,
        source_type=ext.lstrip(".") or "text",
        title=file.filename,
        status="pending",
        chunk_count=0,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    doc.source_uri = save_file(org.id, doc.id, raw, ext)
    db.commit()

    # Process off the request thread; status moves pending -> processing -> ready.
    background.add_task(ingest_document, doc.id, raw, file.content_type, file.filename)

    return _doc_to_dict(doc)


@router.delete("/documents/{document_id}")
@limiter.limit("30/minute")
def delete_document(
    request: Request,
    document_id: UUID,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    doc = db.get(KnowledgeDocument, document_id)
    if doc is None or doc.org_id != org.id:  # enforce tenant ownership
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="document not found")

    db.execute(
        DocumentChunk.__table__.delete().where(DocumentChunk.document_id == doc.id)
    )
    delete_file(doc.source_uri)
    db.delete(doc)
    db.commit()
    return {"deleted": str(document_id)}
