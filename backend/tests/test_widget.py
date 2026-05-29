"""Tests for the widget endpoints (public config + authed settings)."""

import uuid

from fastapi.testclient import TestClient

from app.core.deps import get_current_org, get_db
from app.main import app
from app.models import Organization


def _seed_org(db) -> Organization:  # noqa: ANN001
    org = Organization(
        name="Widget Test Co",
        slug=f"widget-test-{uuid.uuid4().hex[:8]}",
        plan="free",
        widget_key=f"wk_test_{uuid.uuid4().hex[:16]}",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


# --- public config ----------------------------------------------------------

def test_widget_config_public_returns_appearance(db_session) -> None:
    org = _seed_org(db_session)
    app.dependency_overrides[get_db] = lambda: db_session
    try:
        client = TestClient(app)
        r = client.get(f"/api/widget/config?key={org.widget_key}")
        assert r.status_code == 200
        body = r.json()
        assert body["organization"] == "Widget Test Co"
        assert body["primary_color"]  # default applied via get_or_create
        assert body["position"] in {"bottom-right", "bottom-left"}
    finally:
        app.dependency_overrides.clear()


def test_widget_config_rejects_unknown_key(db_session) -> None:
    app.dependency_overrides[get_db] = lambda: db_session
    try:
        client = TestClient(app)
        r = client.get("/api/widget/config?key=wk_does_not_exist")
        assert r.status_code == 404
    finally:
        app.dependency_overrides.clear()


# --- authed settings --------------------------------------------------------

def test_widget_settings_get_returns_key(db_session) -> None:
    org = _seed_org(db_session)
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        client = TestClient(app)
        r = client.get("/api/widget/settings")
        assert r.status_code == 200
        body = r.json()
        assert body["widget_key"] == org.widget_key
        assert "primary_color" in body
    finally:
        app.dependency_overrides.clear()


def test_widget_settings_put_updates_and_clamps(db_session) -> None:
    org = _seed_org(db_session)
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        client = TestClient(app)
        r = client.put(
            "/api/widget/settings",
            json={
                "primary_color": "#10b981",
                "position": "bottom-left",
                "welcome_message": "สวัสดีครับ",
                "persona_prompt": None,
            },
        )
        assert r.status_code == 200
        body = r.json()
        assert body["primary_color"] == "#10b981"
        assert body["position"] == "bottom-left"
        assert body["welcome_message"] == "สวัสดีครับ"

        # Unknown position clamps to bottom-right (safe default).
        r = client.put(
            "/api/widget/settings",
            json={
                "primary_color": "#10b981",
                "position": "middle-of-screen",
                "welcome_message": "hi",
                "persona_prompt": None,
            },
        )
        assert r.json()["position"] == "bottom-right"
    finally:
        app.dependency_overrides.clear()
