"""Unit tests for the ingestion building blocks (no DB / no network)."""

import pytest

from app.services import embeddings as _embeddings
from app.services.chunking import chunk_text
from app.services.embeddings import EMBEDDING_DIM, embed_query, embed_texts
from app.services.parsing import extract_text


@pytest.fixture(autouse=True)
def _force_keyless_embeddings(monkeypatch):  # noqa: ANN001
    """These are offline unit tests — pin embeddings to the keyless deterministic
    fallback so a real provider key in a local .env can't pull them onto the network."""
    monkeypatch.setattr(_embeddings, "_has_voyage", lambda: False)
    monkeypatch.setattr(_embeddings, "_has_openai", lambda: False)


# --- parsing ---

def test_extract_text_plain() -> None:
    out = extract_text(b"Hello world", content_type="text/plain", filename="a.txt")
    assert out == "Hello world"


def test_extract_text_by_extension() -> None:
    out = extract_text(b"# Title\n\nbody", filename="readme.md")
    assert "Title" in out


# --- chunking ---

def test_chunk_text_empty() -> None:
    assert chunk_text("") == []


def test_chunk_text_short_is_single_chunk() -> None:
    chunks = chunk_text("one\n\ntwo\n\nthree")
    assert len(chunks) == 1
    assert "one" in chunks[0] and "three" in chunks[0]


def test_chunk_text_long_splits_with_overlap() -> None:
    # ~30 paragraphs of filler -> should produce multiple chunks
    text = "\n\n".join(f"Paragraph number {i} with some filler words here." for i in range(120))
    chunks = chunk_text(text, max_tokens=120, overlap_tokens=20)
    assert len(chunks) > 1
    # Each chunk should be non-empty
    assert all(c.strip() for c in chunks)


# --- embeddings (fake/dev mode — dummy key) ---

def test_embed_dimension_and_determinism() -> None:
    a = embed_query("hello world")
    b = embed_query("hello world")
    assert len(a) == EMBEDDING_DIM
    assert a == b  # deterministic in fallback mode


def test_embed_batch_matches_count() -> None:
    vecs = embed_texts(["a", "b", "c"])
    assert len(vecs) == 3
    assert all(len(v) == EMBEDDING_DIM for v in vecs)


def test_embed_different_text_differs() -> None:
    assert embed_query("apple") != embed_query("orange")
