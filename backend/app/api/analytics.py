"""Org-scoped analytics for the dashboard overview.

All figures are aggregated in SQL and scoped to the authenticated org. The daily
series is bucketed in Python (portable across Postgres/SQLite, bounded date range).
"""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_org, get_db
from app.core.security import limiter
from app.models import Conversation, Message, Organization

router = APIRouter()

HANDOFF_THRESHOLD = 0.4


def _range_days(range_: str) -> int:
    return 30 if range_ == "30d" else 7


@router.get("/overview")
@limiter.limit("60/minute")
def overview(
    request: Request,
    window: str = Query("7d", alias="range", pattern="^(7d|30d)$"),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> dict:
    days = _range_days(window)
    # Bucket from midnight of the first day so the series has exactly `days` points.
    today = datetime.now(UTC).date()
    start_day = today - timedelta(days=days - 1)
    cutoff = datetime(start_day.year, start_day.month, start_day.day)

    org_convs = select(Conversation.id).where(
        Conversation.org_id == org.id, Conversation.created_at >= cutoff
    )

    total_convs = db.scalar(select(func.count()).select_from(org_convs.subquery())) or 0

    total_msgs = (
        db.scalar(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.org_id == org.id, Message.created_at >= cutoff)
        )
        or 0
    )

    # Conversations that needed (or would need) a human: any low-confidence answer.
    flagged_convs = (
        db.scalar(
            select(func.count(func.distinct(Message.conversation_id)))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.org_id == org.id,
                Message.created_at >= cutoff,
                Message.role == "assistant",
                Message.confidence < HANDOFF_THRESHOLD,
            )
        )
        or 0
    )
    auto_resolved_pct = round((1 - flagged_convs / total_convs) * 100) if total_convs else 0

    avg_conf = db.scalar(
        select(func.avg(Message.confidence))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.org_id == org.id,
            Message.created_at >= cutoff,
            Message.role == "assistant",
            Message.confidence.is_not(None),
        )
    )

    up, down = db.execute(
        select(
            func.coalesce(func.sum(case((Message.feedback == "positive", 1), else_=0)), 0),
            func.coalesce(func.sum(case((Message.feedback == "negative", 1), else_=0)), 0),
        )
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.org_id == org.id, Message.created_at >= cutoff)
    ).one()
    total_fb = up + down
    score = round(5 * up / total_fb, 1) if total_fb else None

    # Daily conversation counts, zero-filled.
    rows = db.execute(
        select(Conversation.created_at).where(
            Conversation.org_id == org.id, Conversation.created_at >= cutoff
        )
    ).all()
    buckets: dict[str, int] = {}
    for (created,) in rows:
        if created is None:
            continue
        key = created.date().isoformat()
        buckets[key] = buckets.get(key, 0) + 1
    series = [
        {"day": (start_day + timedelta(days=i)).isoformat(),
         "count": buckets.get((start_day + timedelta(days=i)).isoformat(), 0)}
        for i in range(days)
    ]

    return {
        "range": window,
        "conversations": total_convs,
        "messages": total_msgs,
        "auto_resolved_pct": auto_resolved_pct,
        "avg_confidence": round(float(avg_conf), 2) if avg_conf is not None else None,
        "satisfaction": {"up": int(up), "down": int(down), "score": score},
        "series": series,
    }
