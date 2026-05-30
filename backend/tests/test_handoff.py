"""Week 5 tests: human handoff (agent reply / resolve) + multi-tenant isolation."""

import uuid

from fastapi.testclient import TestClient

from app.core.deps import get_current_org, get_current_user, get_db
from app.main import app
from app.models import Conversation, Message, Organization, User


def _seed_org_user(db, name="Co"):  # noqa: ANN001
    org = Organization(
        name=name,
        slug=f"o-{uuid.uuid4().hex[:8]}",
        plan="free",
        widget_key=f"wk_{uuid.uuid4().hex[:16]}",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    user = User(
        clerk_user_id=f"clerk_{uuid.uuid4().hex[:10]}",
        email=f"{uuid.uuid4().hex[:6]}@example.com",
        org_id=org.id,
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return org, user


def _conv(db, org, *, status="active"):  # noqa: ANN001
    c = Conversation(org_id=org.id, status=status, visitor_id="anon-x")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _msg(db, conv, role, content, *, confidence=None):  # noqa: ANN001
    m = Message(conversation_id=conv.id, role=role, content=content, confidence=confidence, citations=[])
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def _as(db, user, org):  # noqa: ANN001
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_org] = lambda: org


# --- handoff -----------------------------------------------------------------

def test_agent_reply_takes_over(db_session) -> None:
    org, user = _seed_org_user(db_session)
    conv = _conv(db_session, org)
    _msg(db_session, conv, "user", "I need help")
    _as(db_session, user, org)
    try:
        client = TestClient(app)
        r = client.post(f"/api/chat/conversations/{conv.id}/reply", json={"content": "Sure, happy to help!"})
        assert r.status_code == 200
        assert r.json()["role"] == "agent"

        db_session.refresh(conv)
        assert conv.status == "handoff"
        assert conv.assigned_agent_id == user.id

        body = client.get(f"/api/chat/conversations/{conv.id}").json()
        assert [m["role"] for m in body["messages"]] == ["user", "agent"]
    finally:
        app.dependency_overrides.clear()


def test_reply_rejects_empty(db_session) -> None:
    org, user = _seed_org_user(db_session)
    conv = _conv(db_session, org)
    _as(db_session, user, org)
    try:
        r = TestClient(app).post(f"/api/chat/conversations/{conv.id}/reply", json={"content": "   "})
        assert r.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_resolve_overrides_low_confidence_status(db_session) -> None:
    org, user = _seed_org_user(db_session)
    conv = _conv(db_session, org)
    _msg(db_session, conv, "user", "weird question")
    _msg(db_session, conv, "assistant", "not sure", confidence=0.2)  # would derive -> handoff
    _as(db_session, user, org)
    try:
        client = TestClient(app)
        assert client.get(f"/api/chat/conversations/{conv.id}").json()["status"] == "handoff"

        r = client.post(f"/api/chat/conversations/{conv.id}/status", json={"status": "resolved"})
        assert r.status_code == 200 and r.json()["status"] == "resolved"

        assert client.get(f"/api/chat/conversations/{conv.id}").json()["status"] == "resolved"
    finally:
        app.dependency_overrides.clear()


# --- multi-tenant isolation --------------------------------------------------

def test_org_b_cannot_touch_org_a_conversation(db_session) -> None:
    org_a, _ = _seed_org_user(db_session, "Org A")
    org_b, user_b = _seed_org_user(db_session, "Org B")
    conv_a = _conv(db_session, org_a)
    msg_a = _msg(db_session, conv_a, "assistant", "secret", confidence=0.9)

    _as(db_session, user_b, org_b)  # logged in as Org B
    try:
        client = TestClient(app)
        assert client.get(f"/api/chat/conversations/{conv_a.id}").status_code == 404
        assert client.post(f"/api/chat/conversations/{conv_a.id}/reply", json={"content": "hi"}).status_code == 404
        assert client.post(f"/api/chat/conversations/{conv_a.id}/status", json={"status": "resolved"}).status_code == 404
        assert client.post("/api/chat/feedback", json={"message_id": str(msg_a.id), "value": "positive"}).status_code == 404
        # B's own list + analytics never surface A's data
        assert client.get("/api/chat/conversations").json() == []
        assert client.get("/api/analytics/overview").json()["conversations"] == 0
    finally:
        app.dependency_overrides.clear()
