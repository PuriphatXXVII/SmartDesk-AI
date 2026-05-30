"""Tests for outbound webhooks: signing, delivery, and org settings endpoint."""

import hashlib
import hmac
import json
import uuid

from fastapi.testclient import TestClient

import app.services.webhooks as wh
from app.core.deps import get_current_org, get_db
from app.main import app
from app.models import Organization
from app.services.webhooks import build_payload, deliver, sign


def test_sign_matches_hmac_sha256() -> None:
    body = b'{"a":1}'
    expected = "sha256=" + hmac.new(b"secret", body, hashlib.sha256).hexdigest()
    assert sign("secret", body) == expected


def test_deliver_posts_signed_payload(monkeypatch) -> None:  # noqa: ANN001
    captured: dict = {}

    def fake_post(url, content=None, headers=None, timeout=None):  # noqa: ANN001, ANN202
        captured.update(url=url, content=content, headers=headers)

        class _R:
            status_code = 200

        return _R()

    monkeypatch.setattr(wh.httpx, "post", fake_post)
    payload = build_payload("conversation.started", {"conversation_id": "c1"}, "org1")
    code = deliver("https://hook.example/x", "s3cr3t", payload)

    assert code == 200
    assert captured["url"] == "https://hook.example/x"
    assert captured["headers"]["X-SmartDesk-Event"] == "conversation.started"
    assert captured["headers"]["X-SmartDesk-Signature"] == sign("s3cr3t", captured["content"])
    assert json.loads(captured["content"])["data"] == {"conversation_id": "c1"}


def test_deliver_never_raises(monkeypatch) -> None:  # noqa: ANN001
    def boom(*a, **k):  # noqa: ANN002, ANN003, ANN202
        raise RuntimeError("network down")

    monkeypatch.setattr(wh.httpx, "post", boom)
    assert deliver("https://x", None, build_payload("e", {}, "o")) is None


def _seed_org(db) -> Organization:  # noqa: ANN001
    org = Organization(
        name="WH Co",
        slug=f"wh-{uuid.uuid4().hex[:8]}",
        plan="free",
        widget_key=f"wk_{uuid.uuid4().hex[:16]}",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def test_settings_get_put_never_echoes_secret(db_session) -> None:
    org = _seed_org(db_session)
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        c = TestClient(app)
        body = c.get("/api/settings").json()
        assert body["webhook_url"] is None
        assert body["webhook_secret_set"] is False

        r = c.put(
            "/api/settings",
            json={"webhook_url": "https://hook.example/x", "webhook_secret": "topsecret"},
        )
        b = r.json()
        assert b["webhook_url"] == "https://hook.example/x"
        assert b["webhook_secret_set"] is True
        assert "webhook_secret" not in b  # secret is never returned

        # Clearing the URL but omitting the secret leaves the secret in place.
        r2 = c.put("/api/settings", json={"webhook_url": ""})
        assert r2.json()["webhook_url"] is None
        assert r2.json()["webhook_secret_set"] is True
    finally:
        app.dependency_overrides.clear()
