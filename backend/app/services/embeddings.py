"""Embedding generation.

Uses OpenAI `text-embedding-3-small` (1536-dim) when a real key is configured.
Otherwise falls back to a deterministic pseudo-embedding derived from a hash of
the text — this keeps the whole upload -> chunk -> store -> search flow working
end-to-end in dev without an API key. Semantic quality is meaningless in fallback
mode (it only matches identical/near-identical text), so add a real OPENAI_API_KEY
for genuine retrieval.
"""

from __future__ import annotations

import hashlib
import math

from app.core.config import get_settings

settings = get_settings()

EMBEDDING_DIM = 1536


def _is_real_key(key: str) -> bool:
    return bool(key) and key.startswith("sk-") and "dummy" not in key


def _fake_embedding(text: str) -> list[float]:
    """Deterministic unit vector seeded by the text hash (dev only)."""
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    # Expand the 32-byte digest into 1536 floats, then L2-normalize.
    vals: list[float] = []
    counter = 0
    while len(vals) < EMBEDDING_DIM:
        h = hashlib.sha256(seed + counter.to_bytes(4, "big")).digest()
        for b in h:
            vals.append((b / 255.0) * 2 - 1)  # [-1, 1]
            if len(vals) >= EMBEDDING_DIM:
                break
        counter += 1
    norm = math.sqrt(sum(v * v for v in vals)) or 1.0
    return [v / norm for v in vals]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Return one embedding per input text."""
    if not texts:
        return []

    if _is_real_key(settings.openai_api_key):
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.embeddings.create(model=settings.embedding_model, input=texts)
        return [item.embedding for item in resp.data]

    return [_fake_embedding(t) for t in texts]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]


def using_real_embeddings() -> bool:
    return _is_real_key(settings.openai_api_key)
