"""Tests for auth provisioning, the /me endpoint, and the Clerk webhook."""

import uuid

from fastapi.testclient import TestClient

from app.core.deps import get_current_org, get_current_user, get_db, provision_user
from app.main import app
from app.models import Organization, User

# --- provision_user (unit) ---------------------------------------------------

def test_provision_user_creates_org_and_user(db_session) -> None:
    user = provision_user(db_session, clerk_user_id="clerk_abc", email="alice@acme.com")
    assert user.id is not None
    assert user.email == "alice@acme.com"
    assert user.role == "admin"

    org = db_session.get(Organization, user.org_id)
    assert org is not None
    assert org.plan == "free"
    assert org.slug.startswith("alice-")


def test_provision_user_is_idempotent(db_session) -> None:
    first = provision_user(db_session, clerk_user_id="clerk_same", email="bob@acme.com")
    second = provision_user(db_session, clerk_user_id="clerk_same", email="bob@acme.com")
    assert first.id == second.id
    assert db_session.query(User).count() == 1
    assert db_session.query(Organization).count() == 1


# --- /me endpoint (via dependency overrides — config-agnostic) ---------------

def test_me_returns_user_and_org() -> None:
    org = Organization(id=uuid.uuid4(), name="Test Org", slug="test-org", plan="pro")
    user = User(
        id=uuid.uuid4(),
        clerk_user_id="clerk_test",
        email="test@example.com",
        org_id=org.id,
        role="admin",
    )
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        client = TestClient(app)
        r = client.get("/api/auth/me")
        assert r.status_code == 200
        body = r.json()
        assert body["user"]["email"] == "test@example.com"
        assert body["organization"]["name"] == "Test Org"
        assert body["organization"]["plan"] == "pro"
    finally:
        app.dependency_overrides.clear()


# --- Clerk webhook -----------------------------------------------------------

def test_webhook_user_created_provisions_user(db_session) -> None:
    app.dependency_overrides[get_db] = lambda: db_session
    try:
        client = TestClient(app)
        payload = {
            "type": "user.created",
            "data": {
                "id": "clerk_webhook_user",
                "primary_email_address_id": "email_1",
                "email_addresses": [
                    {"id": "email_1", "email_address": "webhook@acme.com"}
                ],
                "first_name": "Web",
                "last_name": "Hook",
            },
        }
        r = client.post("/api/webhooks/clerk", json=payload)
        assert r.status_code == 200
        assert r.json()["status"] == "user_provisioned"

        user = db_session.query(User).filter_by(clerk_user_id="clerk_webhook_user").one()
        assert user.email == "webhook@acme.com"
    finally:
        app.dependency_overrides.clear()


def test_webhook_ignores_unknown_event(db_session) -> None:
    app.dependency_overrides[get_db] = lambda: db_session
    try:
        client = TestClient(app)
        r = client.post("/api/webhooks/clerk", json={"type": "session.created", "data": {}})
        assert r.status_code == 200
        assert r.json()["status"] == "ignored"
    finally:
        app.dependency_overrides.clear()
