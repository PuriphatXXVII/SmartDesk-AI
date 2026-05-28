"""Split document text into overlapping, token-bounded chunks for embedding."""

from __future__ import annotations

import tiktoken

# text-embedding-3-small uses cl100k_base
_ENCODER = tiktoken.get_encoding("cl100k_base")


def chunk_text(text: str, *, max_tokens: int = 500, overlap_tokens: int = 60) -> list[str]:
    """Token-aware sliding-window chunking.

    Splits on paragraph boundaries where possible, then packs paragraphs into
    windows of ~max_tokens with overlap so context isn't lost at chunk edges.
    """
    if not text.strip():
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = len(_ENCODER.encode(para))

        # A single oversized paragraph -> hard-split by tokens.
        if para_tokens > max_tokens:
            if current:
                chunks.append("\n\n".join(current))
                current, current_tokens = [], 0
            chunks.extend(_split_by_tokens(para, max_tokens, overlap_tokens))
            continue

        if current_tokens + para_tokens > max_tokens and current:
            chunks.append("\n\n".join(current))
            # Start next window with a tail overlap from the previous one.
            current, current_tokens = _tail_overlap(current, overlap_tokens)

        current.append(para)
        current_tokens += para_tokens

    if current:
        chunks.append("\n\n".join(current))

    return chunks


def _split_by_tokens(text: str, max_tokens: int, overlap: int) -> list[str]:
    tokens = _ENCODER.encode(text)
    out: list[str] = []
    step = max(1, max_tokens - overlap)
    for start in range(0, len(tokens), step):
        window = tokens[start : start + max_tokens]
        out.append(_ENCODER.decode(window))
        if start + max_tokens >= len(tokens):
            break
    return out


def _tail_overlap(paragraphs: list[str], overlap_tokens: int) -> tuple[list[str], int]:
    """Keep trailing paragraphs whose combined tokens are ~overlap_tokens."""
    kept: list[str] = []
    total = 0
    for para in reversed(paragraphs):
        t = len(_ENCODER.encode(para))
        if total + t > overlap_tokens and kept:
            break
        kept.insert(0, para)
        total += t
    return kept, total
