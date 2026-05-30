"""Tests for Week 4: analytics overview + enriched conversations + feedback."""

import uuid

from fastapi.testclient import TestClient

from app.core.deps import get_current_org, get_db
from app.main import app
from app.models import Conversation, Message, Organization


def _seed_org(db, name="Analytics Co"):  # noqa: ANN001
    org = Organization(
        name=name,
        slug=f"a-{uuid.uuid4().hex[:8]}",
        plan="free",
        widget_key=f"wk_{uuid.uuid4().hex[:16]}",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def _conv(db, org, *, status="active", visitor="anon-1"):  # noqa: ANN001
    c = Conversation(org_id=org.id, status=status, visitor_id=visitor)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _msg(db, conv, role, content, *, confidence=None, feedback=None):  # noqa: ANN001
    m = Message(
        conversation_id=conv.id,
        role=role,
        content=content,
        confidence=confidence,
        feedback=feedback,
        citations=[],
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def _seed_two_convs(db, org):  # noqa: ANN001
    # Resolved conversation (high confidence, thumbs up)
    resolved = _conv(db, org, visitor="anon-good")
    _msg(db, resolved, "user", "How do I reset my password?")
    _msg(db, resolved, "assistant", "Go to settings.", confidence=0.9, feedback="positive")
    # Handoff conversation (low confidence, thumbs down)
    handoff = _conv(db, org, visitor="anon-bad")
    _msg(db, handoff, "user", "Refund policy for annual plans?")
    a = _msg(db, handoff, "assistant", "I'm not sure.", confidence=0.3, feedback="negative")
    return resolved, handoff, a


# --- analytics overview ------------------------------------------------------

def test_overview_aggregates(db_session) -> None:
    org = _seed_org(db_session)
    _seed_two_convs(db_session, org)
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        body = TestClient(app).get("/api/analytics/overview").json()
        assert body["conversations"] == 2
        assert body["messages"] == 4
        assert body["auto_resolved_pct"] == 50  # 1 of 2 flagged
        assert body["avg_confidence"] == 0.6  # (0.9 + 0.3) / 2
        assert body["satisfaction"] == {"up": 1, "down": 1, "score": 2.5}
        assert len(body["series"]) == 7
        assert sum(p["count"] for p in body["series"]) == 2
    finally:
        app.dependency_overrides.clear()


def test_overview_empty_org_is_zero_safe(db_session) -> None:
    org = _seed_org(db_session, name="Empty Co")
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        body = TestClient(app).get("/api/analytics/overview?range=30d").json()
        assert body["conversations"] == 0
        assert body["auto_resolved_pct"] == 0
        assert body["avg_confidence"] is None
        assert body["satisfaction"]["score"] is None
        assert len(body["series"]) == 30
    finally:
        app.dependency_overrides.clear()


# --- conversations list + detail --------------------------------------------

def test_conversations_list_and_status_filter(db_session) -> None:
    org = _seed_org(db_session)
    _seed_two_convs(db_session, org)
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        client = TestClient(app)
        rows = client.get("/api/chat/conversations").json()
        assert len(rows) == 2
        assert {r["status"] for r in rows} == {"resolved", "handoff"}
        assert all(r["preview"] for r in rows)

        handoff = client.get("/api/chat/conversations?status=handoff").json()
        assert len(handoff) == 1
        assert handoff[0]["status"] == "handoff"
    finally:
        app.dependency_overrides.clear()


def test_conversation_detail_is_org_scoped(db_session) -> None:
    org_a = _seed_org(db_session, name="Org A")
    org_b = _seed_org(db_session, name="Org B")
    conv_a = _conv(db_session, org_a)
    _msg(db_session, conv_a, "user", "hi")

    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org_b  # logged in as B
    try:
        # Org B cannot read Org A's conversation.
        assert TestClient(app).get(f"/api/chat/conversations/{conv_a.id}").status_code == 404
    finally:
        app.dependency_overrides.clear()

    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org_a
    try:
        body = TestClient(app).get(f"/api/chat/conversations/{conv_a.id}").json()
        assert body["id"] == str(conv_a.id)
        assert body["messages"][0]["content"] == "hi"
    finally:
        app.dependency_overrides.clear()


# --- feedback ----------------------------------------------------------------

def test_feedback_sets_value_and_is_org_scoped(db_session) -> None:
    org = _seed_org(db_session)
    _, _, assistant_msg = _seed_two_convs(db_session, org)
    other = _seed_org(db_session, name="Other Co")

    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: org
    try:
        r = TestClient(app).post(
            "/api/chat/feedback", json={"message_id": str(assistant_msg.id), "value": "positive"}
        )
        assert r.status_code == 200
        assert r.json()["feedback"] == "positive"
    finally:
        app.dependency_overrides.clear()

    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_org] = lambda: other
    try:
        r = TestClient(app).post(
            "/api/chat/feedback", json={"message_id": str(assistant_msg.id), "value": "negative"}
        )
        assert r.status_code == 404  # not this org's message
    finally:
        app.dependency_overrides.clear()
