"""File storage. Local disk in dev; swap for S3/R2 in production.

Files are stored under uploads/{org_id}/{document_id}{ext} with a random doc id
so the original (possibly attacker-controlled) filename never touches the path.
"""

from __future__ import annotations

from pathlib import Path
from uuid import UUID

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"


def save_file(org_id: UUID, document_id: UUID, data: bytes, ext: str = "") -> str:
    org_dir = UPLOAD_ROOT / str(org_id)
    org_dir.mkdir(parents=True, exist_ok=True)
    safe_ext = "".join(c for c in ext if c.isalnum() or c == ".")[:10]
    path = org_dir / f"{document_id}{safe_ext}"
    path.write_bytes(data)
    return str(path)


def delete_file(path: str | None) -> None:
    if not path:
        return
    p = Path(path)
    if p.exists() and UPLOAD_ROOT in p.parents:
        p.unlink(missing_ok=True)
