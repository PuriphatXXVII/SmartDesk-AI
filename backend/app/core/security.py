"""Security utilities — guardrails, sanitization, rate limiting setup."""

from __future__ import annotations

import re

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import get_settings

settings = get_settings()

# -----------------------------------------------------------------------------
# Rate limiter
#   - Production: Redis-backed (shared across instances)
#   - Dev / test / CI:  in-process memory (no Redis dependency)
# -----------------------------------------------------------------------------
_limiter_storage_uri = (
    settings.redis_url if settings.app_env == "production" else "memory://"
)


def _client_ip(request: Request) -> str:
    """Real client IP, honouring the proxy's X-Forwarded-For (Railway/Vercel set it)
    so per-client rate limits aren't all keyed to the load balancer's address."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=_client_ip,
    storage_uri=_limiter_storage_uri,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)

# -----------------------------------------------------------------------------
# Prompt injection / jailbreak heuristics
# -----------------------------------------------------------------------------
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(the\s+)?system\s+prompt", re.IGNORECASE),
    re.compile(r"reveal\s+(your\s+)?system\s+prompt", re.IGNORECASE),
    re.compile(r"act\s+as\s+(a\s+)?different\s+(ai|model|assistant)", re.IGNORECASE),
    re.compile(r"</?\s*system\s*>", re.IGNORECASE),
]


def detect_prompt_injection(text: str) -> bool:
    """Return True if the input looks like a prompt-injection attempt.

    Heuristic only — combine with output filtering and untrusted-input delimiters
    in the system prompt. Never trust this as a sole defense.
    """
    return any(p.search(text) for p in _INJECTION_PATTERNS)


# -----------------------------------------------------------------------------
# PII redaction (lightweight — replace with Presidio for production)
# -----------------------------------------------------------------------------
_PII_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[EMAIL_REDACTED]"),
    (re.compile(r"\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}\b"), "[PHONE_REDACTED]"),
    (re.compile(r"\b(?:\d[ -]*?){13,19}\b"), "[CARD_REDACTED]"),
]


def redact_pii(text: str) -> str:
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def sanitize_user_input(text: str, max_length: int = 4000) -> str:
    """Strip control chars, enforce length limit. Use on every untrusted text input."""
    if not text:
        return ""
    text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or ord(ch) >= 32)
    return text[:max_length].strip()
