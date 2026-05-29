from uuid import UUID

from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.widget import org_by_widget_key
from app.core.db import SessionLocal
from app.core.deps import get_current_org, get_db
from app.core.security import detect_prompt_injection, limiter, sanitize_user_input
from app.models import Conversation, Message, Organization
from app.rag.pipeline import answer, answer_stream

router = APIRouter()


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
    db.commit()

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
    Each message runs the RAG pipeline and streams tokens back.
    """
    await websocket.accept()

    db: Session = SessionLocal()
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
                await websocket.send_json({"type": "error", "message": "empty message"})
                continue
            if detect_prompt_injection(content):
                await websocket.send_json({"type": "flagged", "reason": "suspicious_input"})

            async for event in answer_stream(db, org.id, content):
                await websocket.send_json(event)
    except WebSocketDisconnect:
        return
    finally:
        db.close()


@router.get("/conversations")
@limiter.limit("60/minute")
def list_conversations(
    request: Request,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> list[dict]:
    convs = db.scalars(
        select(Conversation)
        .where(Conversation.org_id == org.id)
        .order_by(Conversation.updated_at.desc())
        .limit(50)
    ).all()
    return [
        {
            "id": str(c.id),
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "message_count": len(c.messages),
        }
        for c in convs
    ]
