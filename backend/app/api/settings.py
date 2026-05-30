"""Org settings — currently the outbound-webhook integration config."""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_org, get_db
from app.core.security import limiter, sanitize_user_input
from app.models import Organization

router = APIRouter()


def _view(org: Organization) -> dict:
    # Never echo the secret back — only whether one is set.
    return {
        "plan": org.plan,
        "widget_key": org.widget_key,
        "webhook_url": org.webhook_url,
        "webhook_secret_set": bool(org.webhook_secret),
    }


@router.get("")
@limiter.limit("60/minute")
def get_org_settings(
    request: Request,
    org: Organization = Depends(get_current_org),
) -> dict:
    return _view(org)


class SettingsUpdate(BaseModel):
    webhook_url: str | None = None
    webhook_secret: str | None = None  # send "" to clear, omit to leave unchanged


@router.put("")
@limiter.limit("30/minute")
def update_org_settings(
    request: Request,
    body: SettingsUpdate,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    url = sanitize_user_input(body.webhook_url or "", max_length=500).strip()
    org.webhook_url = url or None
    if body.webhook_secret is not None:
        secret = sanitize_user_input(body.webhook_secret, max_length=128).strip()
        org.webhook_secret = secret or None
    db.commit()
    return _view(org)
