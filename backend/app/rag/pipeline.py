"""RAG pipeline — to be fully implemented in Week 3.

Steps:
    1. Embed user query
    2. Vector search in pgvector (filtered by org_id)
    3. Rerank candidates
    4. Build prompt with citations
    5. Stream from Claude
    6. Post-process: extract citations, score confidence
"""

from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class RetrievedChunk:
    chunk_id: str
    content: str
    score: float
    document_title: str


@dataclass
class RAGResponse:
    answer: str
    citations: list[RetrievedChunk]
    confidence: float


async def embed_query(text: str) -> list[float]:
    raise NotImplementedError("Week 3")


async def retrieve(org_id: str, query_embedding: list[float], top_k: int = 5) -> list[RetrievedChunk]:
    raise NotImplementedError("Week 3")


async def generate_stream(
    org_id: str,
    question: str,
    history: list[dict] | None = None,
) -> AsyncIterator[dict]:
    """Yield token / citation / done events."""
    raise NotImplementedError("Week 3")
