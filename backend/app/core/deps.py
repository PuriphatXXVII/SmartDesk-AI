"""FastAPI dependencies for authentication + per-request DB session.

`get_current_user` is the single entry point every protected route uses. It:
  1. (dev only, no Clerk) returns a synthetic dev user so the UI can be built
  2. (prod) verifies the Clerk JWT, then finds — or auto-provisions — the user

Auto-provisioning is a safety net: the Clerk webhook (app/api/webhooks.py) is the
primary path that creates users, but if a verified token arrives for an unknown
user we create the org+user on the fly so the request can still succeed.
"""

from __future__ import annotations

import uuid
from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clerk import ClerkClaims, verify_token
from app.core.clerk_api import fetch_clerk_user, full_name, primary_email
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models import Organization, User

settings = get_settings()
_bearer = HTTPBearer(auto_error=False)

DEV_CLERK_ID = "dev_user_local"
DEV_EMAIL = "dev@smartdesk.local"
PLACEHOLDER_EMAIL_SUFFIX = "@users.clerk"


def _resolve_identity(claims: ClerkClaims) -> tuple[str, str | None]:
    """Best-effort (email, display_name) for a verified Clerk user.

    Order: JWT claim (if a session-token template adds it) -> Clerk Backend API
    -> placeholder. The placeholder is only used if the API is unreachable.
    """
    if claims.email:
        return claims.email, None
    data = fetch_clerk_user(claims.clerk_user_id)
    if data:
        email = primary_email(data)
        if email:
            return email, full_name(data)
    return f"{claims.clerk_user_id}{PLACEHOLDER_EMAIL_SUFFIX}", None


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _slug_from(seed: str) -> str:
    base = "".join(c for c in seed.split("@")[0].lower() if c.isalnum() or c == "-")[:40] or "org"
    return f"{base}-{uuid.uuid4().hex[:6]}"


def provision_user(
    db: Session,
    *,
    clerk_user_id: str,
    email: str,
    org_name: str | None = None,
) -> User:
    """Find a user by Clerk ID, or create a fresh org + admin user."""
    user = db.scalar(select(User).where(User.clerk_user_id == clerk_user_id))
    if user:
        return user

    org = Organization(
        name=org_name or f"{email.split('@')[0]}'s workspace",
        slug=_slug_from(email or clerk_user_id),
        plan="free",
    )
    db.add(org)
    db.flush()  # assign org.id

    user = User(clerk_user_id=clerk_user_id, email=email, org_id=org.id, role="admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    # --- Dev bypass: no Clerk configured in a non-prod env ---
    if settings.dev_auth_bypass:
        return provision_user(
            db, clerk_user_id=DEV_CLERK_ID, email=DEV_EMAIL, org_name="Dev Workspace"
        )

    # --- Real verification ---
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims: ClerkClaims = verify_token(creds.credentials)

    existing = db.scalar(select(User).where(User.clerk_user_id == claims.clerk_user_id))
    if existing:
        # Self-heal records provisioned before we could resolve a real email.
        if existing.email.endswith(PLACEHOLDER_EMAIL_SUFFIX):
            email, name = _resolve_identity(claims)
            if not email.endswith(PLACEHOLDER_EMAIL_SUFFIX):
                existing.email = email
                org = db.get(Organization, existing.org_id)
                if org and name:
                    org.name = f"{name}'s workspace"
                db.commit()
                db.refresh(existing)
        return existing

    email, name = _resolve_identity(claims)
    return provision_user(
        db,
        clerk_user_id=claims.clerk_user_id,
        email=email,
        org_name=f"{name}'s workspace" if name else None,
    )


def get_current_org(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Organization:
    org = db.get(Organization, user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="organization not found")
    return org
