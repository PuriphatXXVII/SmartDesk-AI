from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status

from app.core.config import get_settings
from app.core.security import limiter

router = APIRouter()
settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
}


@router.get("/documents")
@limiter.limit("60/minute")
def list_documents(request: Request) -> list[dict]:
    # TODO(week 2): query knowledge_documents filtered by org_id
    return []


@router.post("/documents/upload")
@limiter.limit("10/minute")
async def upload_document(request: Request, file: UploadFile = File(...)) -> dict:
    # Size check (UploadFile.size is None until read in some configs)
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if file.size and file.size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.max_upload_mb}MB)",
        )

    # MIME check (defense in depth; do NOT trust client-supplied content-type alone)
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    # TODO(week 2):
    # 1. Re-verify type via magic-bytes (python-magic) — never trust content-type alone
    # 2. Scan with ClamAV in background queue
    # 3. Save to S3 / R2 with random key (don't preserve original filename in path)
    # 4. Create knowledge_documents row (status=pending)
    # 5. Enqueue Celery job: parse → chunk → embed → store
    return {"document_id": "stub", "status": "pending", "filename": file.filename}


@router.delete("/documents/{document_id}")
@limiter.limit("30/minute")
def delete_document(request: Request, document_id: UUID) -> dict:
    # TODO(week 2): verify org_id ownership before delete (cascade chunks)
    return {"deleted": str(document_id)}
