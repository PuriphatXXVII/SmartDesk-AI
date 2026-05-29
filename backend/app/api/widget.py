"""Widget endpoints.

- Public:  GET /api/widget/config?key=wk_xxx   -> render config for the embedded widget
- Authed:  GET/PUT /api/widget/settings        -> dashboard manages the widget + sees its key

The widget_key is public (lives in the customer's page HTML) and maps to exactly
one org. The WebSocket chat (app/api/chat.py) resolves the same key to an org.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_org, get_db
from app.core.security import limiter, sanitize_user_input
from app.models import Organization, WidgetConfig

router = APIRouter()


def get_or_create_config(db: Session, org_id) -> WidgetConfig:  # noqa: ANN001
    cfg = db.get(WidgetConfig, org_id)
    if cfg is None:
        cfg = WidgetConfig(org_id=org_id)
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def org_by_widget_key(db: Session, key: str) -> Organization | None:
    if not key:
        return None
    return db.scalar(select(Organization).where(Organization.widget_key == key))


class WidgetSettings(BaseModel):
    primary_color: str = "#3b82f6"
    position: str = "bottom-right"
    welcome_message: str = "Hi! How can I help you?"
    persona_prompt: str | None = None


def _config_dict(cfg: WidgetConfig) -> dict:
    return {
        "primary_color": cfg.primary_color,
        "position": cfg.position,
        "welcome_message": cfg.welcome_message,
        "persona_prompt": cfg.persona_prompt,
    }


@router.get("/config")
@limiter.limit("120/minute")
def public_widget_config(request: Request, key: str, db: Session = Depends(get_db)) -> dict:
    """Public — the embedded widget fetches its appearance using its widget_key."""
    org = org_by_widget_key(db, key)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="invalid widget key")
    cfg = get_or_create_config(db, org.id)
    return {"organization": org.name, **_config_dict(cfg)}


@router.get("/settings")
@limiter.limit("60/minute")
def get_widget_settings(
    request: Request,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    cfg = get_or_create_config(db, org.id)
    return {"widget_key": org.widget_key, **_config_dict(cfg)}


@router.put("/settings")
@limiter.limit("30/minute")
def update_widget_settings(
    request: Request,
    body: WidgetSettings,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    cfg = get_or_create_config(db, org.id)
    cfg.primary_color = sanitize_user_input(body.primary_color, max_length=16) or "#3b82f6"
    cfg.position = body.position if body.position in {"bottom-right", "bottom-left"} else "bottom-right"
    cfg.welcome_message = sanitize_user_input(body.welcome_message, max_length=200) or "Hi!"
    cfg.persona_prompt = sanitize_user_input(body.persona_prompt or "", max_length=1000) or None
    db.commit()
    db.refresh(cfg)
    return {"widget_key": org.widget_key, **_config_dict(cfg)}
