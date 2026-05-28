import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._types import GUID


class WidgetConfig(Base):
    __tablename__ = "widget_configs"

    org_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        primary_key=True,
    )
    primary_color: Mapped[str] = mapped_column(String(16), default="#3b82f6")
    position: Mapped[str] = mapped_column(String(32), default="bottom-right")
    welcome_message: Mapped[str] = mapped_column(Text, default="Hi! How can I help you?")
    persona_prompt: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
