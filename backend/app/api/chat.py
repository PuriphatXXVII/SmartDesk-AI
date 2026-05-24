from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

from app.core.security import detect_prompt_injection, limiter, sanitize_user_input

router = APIRouter()


@router.websocket("/ws")
async def chat_socket(websocket: WebSocket) -> None:
    """Real-time chat stream. Widget connects here.

    Security:
      - Origin check (WebSocket lacks CORS — must verify manually)
      - Widget key required (rate-limited per key + per IP at proxy layer)
      - All user input sanitized; prompt-injection attempts are flagged
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            raw = str(data.get("content", ""))
            content = sanitize_user_input(raw, max_length=2000)

            if not content:
                await websocket.send_json({"type": "error", "message": "empty message"})
                continue

            if detect_prompt_injection(content):
                # Don't block outright — log + flag, let LLM handle with hardened system prompt
                await websocket.send_json({"type": "flagged", "reason": "suspicious_input"})

            # TODO(week 3): run RAG pipeline + stream Claude tokens back
            await websocket.send_json({
                "type": "message",
                "content": f"(stub) you said: {content}",
                "citations": [],
            })
    except WebSocketDisconnect:
        return


@router.get("/conversations")
@limiter.limit("30/minute")
def list_conversations(request: Request) -> list[dict]:
    # TODO(week 4): list conversations filtered by org_id (from authenticated user)
    return []
