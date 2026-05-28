"""Portable column types.

Production runs on PostgreSQL (native UUID, JSONB, pgvector). Local dev can run
on SQLite with zero setup. These helpers pick the right type per dialect so the
same models work in both — `create_all()` succeeds on SQLite, and we still get
JSONB indexing + pgvector search in production.
"""

from sqlalchemy import JSON
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeEngine

# UUID: native `uuid` on Postgres, CHAR(32) on SQLite. SQLAlchemy 2.0 handles both.
# Use `GUID()` in mapped_column(...).
GUID = SAUuid

# JSON: JSONB (indexable) on Postgres, plain JSON on SQLite.
JSONType: TypeEngine = JSONB().with_variant(JSON(), "sqlite")


def embedding_column(dim: int = 1024) -> TypeEngine:
    """pgvector `vector(dim)` on Postgres; JSON array on SQLite.

    Vector similarity search only works on Postgres — SQLite is for dev/UI work
    before the RAG pipeline (Week 2+) needs real vectors.
    """
    from pgvector.sqlalchemy import Vector

    return Vector(dim).with_variant(JSON(), "sqlite")
