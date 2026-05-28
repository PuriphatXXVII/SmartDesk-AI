"""switch embedding dimension 1536 -> 1024 (Voyage voyage-3.5-lite)

Drops and recreates the embedding column (vectors of a different dimension can't
be cast in place). Existing chunks lose their vectors and must be re-ingested —
acceptable because the old vectors were a different model/dimension anyway.

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _recreate_embedding(dim: int) -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding")
    op.drop_column("document_chunks", "embedding")
    op.add_column("document_chunks", sa.Column("embedding", Vector(dim), nullable=True))
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding "
        "ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def upgrade() -> None:
    _recreate_embedding(1024)


def downgrade() -> None:
    _recreate_embedding(1536)
