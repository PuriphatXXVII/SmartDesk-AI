"""Embedding generation.

Provider priority:
  1. Voyage AI (voyage-3.5-lite, 1024-dim, multilingual)  — preferred
  2. OpenAI (text-embedding-3-small @ 1024 dims)           — if configured
  3. Deterministic hash-based fallback                      — dev, no keys

The fallback keeps the upload -> chunk -> store -> search flow working without
any API key (it only matches near-identical text). Set VOYAGE_API_KEY for real
multilingual semantic retrieval.

Voyage uses input_type to specialize embeddings: "document" when indexing,
"query" when searching — this measurably improves retrieval quality.
"""

from __future__ import annotations

import hashlib
import math

import httpx

from app.core.config import get_settings

settings = get_settings()

EMBEDDING_DIM = 1024
VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"


def _has_voyage() -> bool:
    return bool(settings.voyage_api_key) and settings.voyage_api_key.startswith("pa-")


def _has_openai() -> bool:
    k = settings.openai_api_key
    return bool(k) and k.startswith("sk-") and "dummy" not in k


def _fake_embedding(text: str) -> list[float]:
    """Deterministic unit vector seeded by the text hash (dev only)."""
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    vals: list[float] = []
    counter = 0
    while len(vals) < EMBEDDING_DIM:
        h = hashlib.sha256(seed + counter.to_bytes(4, "big")).digest()
        for b in h:
            vals.append((b / 255.0) * 2 - 1)
            if len(vals) >= EMBEDDING_DIM:
                break
        counter += 1
    norm = math.sqrt(sum(v * v for v in vals)) or 1.0
    return [v / norm for v in vals]


def _voyage_embed(texts: list[str], input_type: str) -> list[list[float]]:
    resp = httpx.post(
        VOYAGE_URL,
        headers={"Authorization": f"Bearer {settings.voyage_api_key}"},
        json={
            "input": texts,
            "model": settings.voyage_model,
            "input_type": input_type,
            "output_dimension": EMBEDDING_DIM,
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    data = resp.json()["data"]
    return [item["embedding"] for item in data]  # Voyage preserves input order


def _openai_embed(texts: list[str]) -> list[list[float]]:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.embeddings.create(
        model=settings.embedding_model, input=texts, dimensions=EMBEDDING_DIM
    )
    return [item.embedding for item in resp.data]


def embed_texts(texts: list[str], *, input_type: str = "document") -> list[list[float]]:
    if not texts:
        return []
    if _has_voyage():
        try:
            return _voyage_embed(texts, input_type)
        except httpx.HTTPError:
            pass  # fall through to next provider
    if _has_openai():
        return _openai_embed(texts)
    return [_fake_embedding(t) for t in texts]


def embed_query(text: str) -> list[float]:
    return embed_texts([text], input_type="query")[0]


def active_provider() -> str:
    if _has_voyage():
        return "voyage"
    if _has_openai():
        return "openai"
    return "fake"


def using_real_embeddings() -> bool:
    return active_provider() != "fake"
