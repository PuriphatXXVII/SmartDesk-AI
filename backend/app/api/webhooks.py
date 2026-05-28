"""Clerk webhooks — the primary path for syncing users into our DB.

Clerk signs each webhook with Svix. When `CLERK_WEBHOOK_SECRET` is set we verify
the signature (required in production). In dev without a secret we skip
verification but still process the event, so you can test locally with the Clerk
dashboard's "Send test event" button via a tunnel.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_db, provision_user
from app.models import User

router = APIRouter()
settings = get_settings()


async def _verified_payload(request: Request) -> dict:
    body = await request.body()
    if settings.clerk_webhook_secret:
        try:
            from svix.webhooks import Webhook, WebhookVerificationError

            headers = {
                "svix-id": request.headers.get("svix-id", ""),
                "svix-timestamp": request.headers.get("svix-timestamp", ""),
                "svix-signature": request.headers.get("svix-signature", ""),
            }
            wh = Webhook(settings.clerk_webhook_secret)
            return wh.verify(body, headers)
        except WebhookVerificationError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid webhook signature"
            ) from exc
    # Dev fallback — no secret configured
    return json.loads(body or b"{}")


def _primary_email(data: dict) -> str:
    emails = data.get("email_addresses") or []
    primary_id = data.get("primary_email_address_id")
    for e in emails:
        if e.get("id") == primary_id:
            return e.get("email_address", "")
    if emails:
        return emails[0].get("email_address", "")
    return f"{data.get('id', 'unknown')}@users.clerk"


@router.post("/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await _verified_payload(request)
    event_type = payload.get("type", "")
    data = payload.get("data", {})

    if event_type == "user.created":
        clerk_id = data.get("id")
        if clerk_id:
            email = _primary_email(data)
            name_parts = [data.get("first_name"), data.get("last_name")]
            full = " ".join(p for p in name_parts if p) or None
            provision_user(
                db,
                clerk_user_id=clerk_id,
                email=email,
                org_name=f"{full or email.split('@')[0]}'s workspace",
            )
        return {"status": "user_provisioned"}

    if event_type == "user.updated":
        clerk_id = data.get("id")
        user = db.scalar(select(User).where(User.clerk_user_id == clerk_id))
        if user:
            user.email = _primary_email(data)
            db.commit()
        return {"status": "user_updated"}

    if event_type == "user.deleted":
        clerk_id = data.get("id")
        user = db.scalar(select(User).where(User.clerk_user_id == clerk_id))
        if user:
            db.delete(user)
            db.commit()
        return {"status": "user_deleted"}

    return {"status": "ignored", "event": event_type}
