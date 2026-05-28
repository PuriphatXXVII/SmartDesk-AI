import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models._base import TimestampMixin, UUIDPrimaryKey
from app.models._types import GUID, JSONType, embedding_column


class KnowledgeDocument(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "knowledge_documents"

    org_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)  # pdf|docx|url|text
    source_uri: Mapped[str | None] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|processing|ready|failed
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("knowledge_documents.id", ondelete="CASCADE")
    )
    org_id: Mapped[uuid.UUID] = mapped_column(GUID(), index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(embedding_column(1024))
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    meta: Mapped[dict] = mapped_column(JSONType, default=dict)

    document: Mapped["KnowledgeDocument"] = relationship(back_populates="chunks")
