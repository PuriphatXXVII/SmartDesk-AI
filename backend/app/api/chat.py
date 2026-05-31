import asyncio
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.widget import org_by_widget_key
from app.core.db import SessionLocal
from app.core.deps import get_current_org, get_current_user, get_db
from app.core.realtime import hub
from app.core.security import detect_prompt_injection, limiter, sanitize_user_input
from app.models import Conversation, Message, Organization, User
from app.rag.pipeline import answer, answer_stream
from app.services.webhooks import notify

router = APIRouter()

HANDOFF_THRESHOLD = 0.4


class QueryRequest(BaseModel):
    question: str
    conversation_id: UUID | None = None


@router.post("/query")
@limiter.limit("30/minute")
def query(
    request: Request,
    body: QueryRequest,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    """Authenticated, non-streaming RAG query — used by the dashboard test chat."""
    question = sanitize_user_input(body.question, max_length=2000)
    if not question:
        return {"answer": "Please enter a question.", "citations": [], "confidence": 0.0}

    conv = None
    if body.conversation_id:
        conv = db.get(Conversation, body.conversation_id)
        if conv and conv.org_id != org.id:
            conv = None
    created = conv is None
    if conv is None:
        conv = Conversation(org_id=org.id, status="active")
        db.add(conv)
        db.flush()

    db.add(Message(conversation_id=conv.id, role="user", content=question))

    result = answer(db, org.id, question)

    db.add(
        Message(
            conversation_id=conv.id,
            role="assistant",
            content=result.answer,
            citations=[_cite(c) for c in result.citations],
            confidence=result.confidence,
        )
    )
    # Auto-flag low-confidence answers for human review (Week 5 handoff).
    if result.confidence < HANDOFF_THRESHOLD and conv.status == "active":
        conv.status = "handoff"
    db.commit()

    if created:
        notify(org, "conversation.started", {"conversation_id": str(conv.id)})
    if result.confidence < HANDOFF_THRESHOLD:
        notify(
            org,
            "message.low_confidence",
            {"conversation_id": str(conv.id), "confidence": result.confidence, "question": question},
        )

    return {
        "conversation_id": str(conv.id),
        "answer": result.answer,
        "confidence": result.confidence,
        "citations": [_cite(c) for c in result.citations],
        "flagged_for_handoff": result.confidence < 0.4,
    }


def _cite(c) -> dict:  # noqa: ANN001
    return {
        "document_id": c.document_id,
        "title": c.document_title,
        "score": round(c.score, 3),
        "snippet": c.content[:200],
    }


@router.websocket("/ws")
async def chat_socket(websocket: WebSocket) -> None:
    """Real-time streaming chat for the embeddable widget.

    Auth: the widget passes ?key=wk_xxx (public widget key) which maps to one org.
    A conversation is persisted on the first message so it shows up in the dashboard
    and an agent can take over — agent replies are pushed back here live via `hub`.
    All outbound frames go through one queue + sender task so AI tokens and agent
    messages can't interleave mid-send.
    """
    await websocket.accept()

    db: Session = SessionLocal()
    conv: Conversation | None = None
    out_q: asyncio.Queue = asyncio.Queue()

    async def sender() -> None:
        while True:
            event = await out_q.get()
            await websocket.send_json(event)

    sender_task = asyncio.create_task(sender())
    try:
        org = org_by_widget_key(db, websocket.query_params.get("key", ""))
        if org is None:
            await websocket.send_json({"type": "error", "message": "invalid widget key"})
            await websocket.close()
            return

        while True:
            data = await websocket.receive_json()
            content = sanitize_user_input(str(data.get("content", "")), max_length=2000)
            if not content:
                await out_q.put({"type": "error", "message": "empty message"})
                continue

            # On the first message: reuse the visitor's existing conversation (the widget
            # echoes back its id so reopening continues the same thread) else create one.
            if conv is None:
                requested = data.get("conversation_id")
                if requested:
                    try:
                        existing = db.get(Conversation, UUID(str(requested)))
                    except (ValueError, AttributeError):
                        existing = None
                    if existing is not None and existing.org_id == org.id:
                        conv = existing
                is_new = conv is None
                if conv is None:
                    conv = Conversation(org_id=org.id, status="active")
                    db.add(conv)
                    db.commit()
                    db.refresh(conv)
                    # Use the visitor's name (from the widget's pre-chat prompt) if given.
                    name = sanitize_user_input(str(data.get("visitor_name", "")), max_length=80).strip()
                    conv.visitor_id = name or f"web-{str(conv.id)[:4]}"
                    db.commit()
                hub.subscribe(str(conv.id), out_q)
                await out_q.put({"type": "session", "conversation_id": str(conv.id)})
                if is_new:
                    notify(org, "conversation.started", {"conversation_id": str(conv.id)})

            if detect_prompt_injection(content):
                await out_q.put({"type": "flagged", "reason": "suspicious_input"})

            db.add(Message(conversation_id=conv.id, role="user", content=content))
            db.commit()

            parts: list[str] = []
            confidence: float | None = None
            citations: list = []
            async for event in answer_stream(db, org.id, content):
                if event.get("type") == "token":
                    parts.append(event.get("content", ""))
                elif event.get("type") == "citations":
                    confidence = event.get("confidence")
                    citations = event.get("citations", [])
                await out_q.put(event)

            db.add(
                Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content="".join(parts),
                    citations=citations,
                    confidence=confidence,
                )
            )
            if confidence is not None and confidence < HANDOFF_THRESHOLD and conv.status == "active":
                conv.status = "handoff"
            db.commit()
            if confidence is not None and confidence < HANDOFF_THRESHOLD:
                notify(org, "message.low_confidence",
                       {"conversation_id": str(conv.id), "confidence": confidence})
    except WebSocketDisconnect:
        pass
    finally:
        sender_task.cancel()
        if conv is not None:
            hub.unsubscribe(str(conv.id), out_q)
        db.close()


def _derive_status(conv: Conversation) -> str:
    """Explicit terminal status wins (agent resolved / handoff); otherwise derive
    from answer confidence so legacy 'active' rows still surface low-confidence chats."""
    if conv.status in ("resolved", "handoff"):
        return conv.status
    for m in conv.messages:
        if m.role == "assistant" and m.confidence is not None and m.confidence < HANDOFF_THRESHOLD:
            return "handoff"
    return "resolved"


def _last_confidence(conv: Conversation) -> float | None:
    for m in reversed(conv.messages):
        if m.role == "assistant" and m.confidence is not None:
            return round(m.confidence, 3)
    return None


def _preview(conv: Conversation) -> str:
    for m in conv.messages:
        if m.role == "user" and m.content:
            return m.content[:120]
    return conv.messages[0].content[:120] if conv.messages else ""


@router.get("/conversations")
@limiter.limit("60/minute")
def list_conversations(
    request: Request,
    window: str = Query("7d", alias="range", pattern="^(7d|30d|all)$"),
    status: str = Query("all", pattern="^(all|resolved|handoff)$"),
    limit: int = Query(50, ge=1, le=200),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = (
        select(Conversation)
        .where(Conversation.org_id == org.id)
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    if window != "all":
        cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=30 if window == "30d" else 7)
        stmt = stmt.where(Conversation.created_at >= cutoff)

    out: list[dict] = []
    for c in db.scalars(stmt):
        st = _derive_status(c)
        if status != "all" and st != status:
            continue
        out.append(
            {
                "id": str(c.id),
                "visitor": c.visitor_id or f"anon-{str(c.id)[:4]}",
                "preview": _preview(c),
                "status": st,
                "confidence": _last_confidence(c),
                "message_count": len(c.messages),
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "last_at": c.updated_at.isoformat() if c.updated_at else None,
            }
        )
        if len(out) >= limit:
            break
    return out


@router.get("/conversations/{conversation_id}")
@limiter.limit("120/minute")
def get_conversation(
    request: Request,
    conversation_id: UUID,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    conv = db.get(Conversation, conversation_id)
    if conv is None or conv.org_id != org.id:
        raise HTTPException(status_code=404, detail="conversation not found")
    return {
        "id": str(conv.id),
        "visitor": conv.visitor_id or f"anon-{str(conv.id)[:4]}",
        "status": _derive_status(conv),
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "citations": m.citations or [],
                "confidence": round(m.confidence, 3) if m.confidence is not None else None,
                "feedback": m.feedback,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in conv.messages
        ],
    }


class FeedbackRequest(BaseModel):
    message_id: UUID
    value: str  # "positive" | "negative" | "clear"


@router.post("/feedback")
@limiter.limit("60/minute")
def submit_feedback(
    request: Request,
    body: FeedbackRequest,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    msg = db.get(Message, body.message_id)
    if msg is not None:
        conv = db.get(Conversation, msg.conversation_id)
        if conv is None or conv.org_id != org.id:
            msg = None
    if msg is None:
        raise HTTPException(status_code=404, detail="message not found")
    msg.feedback = None if body.value == "clear" else ("positive" if body.value == "positive" else "negative")
    db.commit()
    return {"ok": True, "feedback": msg.feedback}


# --- Human handoff (Week 5): an agent takes over and replies / resolves -------

class AgentReply(BaseModel):
    content: str


@router.post("/conversations/{conversation_id}/reply")
@limiter.limit("60/minute")
def agent_reply(
    request: Request,
    conversation_id: UUID,
    body: AgentReply,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """A human agent posts a message into the conversation, taking it over from the AI."""
    conv = db.get(Conversation, conversation_id)
    if conv is None or conv.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="conversation not found")
    content = sanitize_user_input(body.content, max_length=4000)
    if not content:
        raise HTTPException(status_code=422, detail="empty message")
    msg = Message(conversation_id=conv.id, role="agent", content=content)
    conv.assigned_agent_id = user.id
    conv.status = "handoff"
    db.add(msg)
    db.commit()
    db.refresh(msg)
    # Push the agent reply to the visitor's widget in real time (if they're online).
    delivered = hub.publish(
        str(conv.id),
        {"type": "agent", "content": msg.content, "message_id": str(msg.id)},
    )
    org = db.get(Organization, conv.org_id)
    if org is not None:
        notify(org, "conversation.handoff", {"conversation_id": str(conv.id), "agent_id": str(user.id)})
    return {
        "id": str(msg.id),
        "role": "agent",
        "content": msg.content,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
        "delivered_live": delivered,
    }


class StatusUpdate(BaseModel):
    status: str  # active | handoff | resolved


@router.post("/conversations/{conversation_id}/status")
@limiter.limit("60/minute")
def set_conversation_status(
    request: Request,
    conversation_id: UUID,
    body: StatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if body.status not in {"active", "handoff", "resolved"}:
        raise HTTPException(status_code=422, detail="invalid status")
    conv = db.get(Conversation, conversation_id)
    if conv is None or conv.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="conversation not found")
    conv.status = body.status
    if body.status == "handoff":
        conv.assigned_agent_id = user.id
    db.commit()
    return {"ok": True, "status": conv.status}
