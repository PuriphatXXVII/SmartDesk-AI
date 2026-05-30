"""Outbound webhooks: notify an org's configured endpoint of key events.

Fire-and-forget over a daemon thread so it never blocks (or breaks) the request,
and works from both sync HTTP handlers and the async WebSocket. Each delivery is
signed with HMAC-SHA256 over the raw body (header `X-SmartDesk-Signature`) so the
receiver can verify authenticity.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import threading
import time
from typing import Any

import httpx

from app.models import Organization


def sign(secret: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def build_payload(event: str, data: dict[str, Any], org_id: str) -> dict[str, Any]:
    return {"event": event, "org_id": org_id, "timestamp": int(time.time()), "data": data}


def deliver(url: str, secret: str | None, payload: dict[str, Any]) -> int | None:
    """POST a single event. Returns the status code, or None on failure. Never raises."""
    try:
        body = json.dumps(payload, separators=(",", ":")).encode()
        headers = {"Content-Type": "application/json", "X-SmartDesk-Event": str(payload.get("event"))}
        if secret:
            headers["X-SmartDesk-Signature"] = sign(secret, body)
        resp = httpx.post(url, content=body, headers=headers, timeout=5.0)
        return resp.status_code
    except Exception:  # noqa: BLE001 — webhooks must never break the app
        return None


def notify(org: Organization, event: str, data: dict[str, Any]) -> None:
    """Schedule a webhook delivery for `org` if it has an endpoint configured."""
    url = getattr(org, "webhook_url", None)
    if not url:
        return
    payload = build_payload(event, data, str(org.id))
    threading.Thread(
        target=deliver, args=(url, org.webhook_secret, payload), daemon=True
    ).start()
