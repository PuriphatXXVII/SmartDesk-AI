"""Clerk session-token (JWT) verification.

Clerk signs session JWTs with RS256. We verify them against Clerk's published
JWKS (public keys), checking signature, issuer, and expiry. Keys are fetched once
and cached by PyJWKClient.

In a non-production env with no Clerk configured, `dev_auth_bypass` is True and
callers should skip verification entirely (see app/core/deps.py).
"""

from __future__ import annotations

from functools import lru_cache

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def _jwks_client() -> PyJWKClient:
    if not settings.clerk_jwks_url:
        raise RuntimeError("CLERK_JWKS_URL is not configured")
    # PyJWKClient caches signing keys in-process (default lifespan 300s).
    return PyJWKClient(settings.clerk_jwks_url, cache_keys=True)


class ClerkClaims:
    """Minimal view over a verified Clerk session token."""

    def __init__(self, raw: dict) -> None:
        self.raw = raw
        self.clerk_user_id: str = raw["sub"]
        self.session_id: str | None = raw.get("sid")
        self.email: str | None = raw.get("email")  # present only with a JWT template
        self.org_id: str | None = raw.get("org_id")
        self.org_role: str | None = raw.get("org_role")


def verify_token(token: str) -> ClerkClaims:
    """Verify a Clerk session JWT and return its claims, or raise 401."""
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        options = {"verify_aud": False}  # Clerk session tokens carry azp, not a fixed aud
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_jwt_issuer or None,
            options=options,
            leeway=5,  # small clock-skew tolerance
        )
        if "sub" not in decoded:
            raise jwt.InvalidTokenError("missing sub claim")
        return ClerkClaims(decoded)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="token expired"
        ) from exc
    except (jwt.InvalidTokenError, RuntimeError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token"
        ) from exc
