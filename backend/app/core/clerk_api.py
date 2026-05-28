"""Clerk Backend API client.

Clerk session JWTs don't carry the user's email by default, so when we provision
a user from a verified token we enrich their profile by calling Clerk's Backend
API with the secret key. (The webhook path already receives full user data.)
"""

from __future__ import annotations

import httpx

from app.core.config import get_settings

settings = get_settings()

CLERK_API_BASE = "https://api.clerk.com/v1"


def primary_email(data: dict) -> str | None:
    """Extract the primary email from a Clerk user object."""
    emails = data.get("email_addresses") or []
    primary_id = data.get("primary_email_address_id")
    for e in emails:
        if e.get("id") == primary_id:
            return e.get("email_address")
    if emails:
        return emails[0].get("email_address")
    return None


def full_name(data: dict) -> str | None:
    parts = [data.get("first_name"), data.get("last_name")]
    name = " ".join(p for p in parts if p)
    return name or None


def fetch_clerk_user(clerk_user_id: str) -> dict | None:
    """GET /users/{id} from Clerk. Returns None if unconfigured or on error."""
    if not settings.clerk_secret_key:
        return None
    try:
        resp = httpx.get(
            f"{CLERK_API_BASE}/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            timeout=10.0,
        )
        if resp.status_code != 200:
            return None
        return resp.json()
    except httpx.HTTPError:
        return None
